import { defineStore } from "pinia";
import type { Ref } from "vue";
import { computed, ref } from "vue";

import { apiService } from "@src/services/api";
import { socketService } from "@src/services/socket";
import type {
  IConversation,
  IContactGroup,
  IUser,
  INotification,
  ICall,
  ISettings,
  IEmoji,
  IMessage,
} from "@src/types";

const useStore = defineStore("chat", () => {
  // local storage
  const storage = JSON.parse(localStorage.getItem("chat") || "{}");

  // app status refs
  const status = ref("idle");

  // app data refs
  // data refs
  const user: Ref<IUser | undefined> = ref(undefined);
  const conversations: Ref<IConversation[]> = ref([]);
  const notifications: Ref<INotification[]> = ref([]);
  const archivedConversations: Ref<IConversation[]> = ref([]);
  const calls: Ref<ICall[]> = ref([]);
  const settings: Ref<ISettings> = ref(
    storage.settings || {
      lastSeen: false,
      readReceipt: false,
      joiningGroups: false,
      privateMessages: false,
      darkMode: false,
      borderedTheme: false,
      allowNotifications: false,
      keepNotifications: false,
    }
  );
  const activeCall: Ref<ICall | undefined> = ref(undefined);
  const recentEmoji: Ref<IEmoji[]> = ref(storage.recentEmoji || []);
  const emojiSkinTone: Ref<string> = ref(storage.emojiSkinTone || "neutral");

  // ui refs
  const activeSidebarComponent: Ref<string> = ref(
    storage.activeSidebarComponent || "messages"
  );
  const delayLoading = ref(true);
  const conversationOpen: Ref<string | undefined> = ref(
    storage.conversationOpen
  );
  const callMinimized = ref(false);
  const openVoiceCall = ref(false);

  // Avatar toggle for self-chat
  const activeAvatar = ref<'A' | 'B'>('A');
  const avatarA = ref({
    id: 1,
    firstName: 'Avatar',
    lastName: 'A',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=387&q=80',
    email: 'avatarA@example.com',
    lastSeen: new Date()
  });
  const avatarB = ref({
    id: 2,
    firstName: 'Avatar',
    lastName: 'B', 
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=387&q=80',
    email: 'avatarB@example.com',
    lastSeen: new Date()
  });

  // contacts grouped alphabetically.
  const contactGroups: Ref<IContactGroup[] | undefined> = computed(() => {
    if (user.value) {
      let sortedContacts = [...user.value.contacts];

      sortedContacts.sort();

      let groups: IContactGroup[] = [];
      let currentLetter: string = "";
      let groupNames: string[] = [];

      // create an array of letter for every different sort level.
      for (let contact of sortedContacts) {
        // if the first letter is different create a new group.
        if (contact.firstName[0].toUpperCase() !== currentLetter) {
          currentLetter = contact.firstName[0].toUpperCase();
          groupNames.push(currentLetter);
        }
      }

      // create an array that groups contact names based on the first letter;
      for (let groupName of groupNames) {
        let group: IContactGroup = { letter: groupName, contacts: [] };
        for (let contact of sortedContacts) {
          if (contact.firstName[0].toUpperCase() === groupName) {
            group.contacts.push(contact);
          }
        }
        groups.push(group);
      }

      return groups;
    }
  });

  const getStatus = computed(() => status);

  // API Methods
  const login = async (email: string, password: string) => {
    try {
      status.value = "loading";
      const result = await apiService.login(email, password);
      user.value = result.user;
      
      // Connect socket
      socketService.connect(result.token);
      
      // Load conversations (this will set status to "success")
      await loadConversations();
      
      return result;
    } catch (error) {
      status.value = "error";
      throw error;
    }
  };

  const register = async (userData: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
  }) => {
    try {
      status.value = "loading";
      const result = await apiService.register(userData);
      user.value = result.user;
      
      // Connect socket
      socketService.connect(result.token);
      
      status.value = "idle";
      return result;
    } catch (error) {
      status.value = "error";
      throw error;
    }
  };

  const logout = () => {
    apiService.logout();
    socketService.disconnect();
    user.value = undefined;
    conversations.value = [];
    status.value = "idle";
  };

  const loadConversations = async () => {
    try {
      console.log('Store: Loading active conversations...');
      const data = await apiService.getConversations();
      console.log('Store: Received active conversations:', data);
      console.log('Store: Avatar values:', data.map(c => ({ id: c.id, name: c.name, displayPhoto: (c as any).displayPhoto, avatarA: (c as any).avatarA, avatarB: (c as any).avatarB })));
      conversations.value = data;
      status.value = "success";
    } catch (error) {
      console.error('Failed to load conversations:', error);
      status.value = "error";
    }
  };

  const sendMessage = async (conversationId: number, content: string, type = 'text', replyTo?: number) => {
    try {
      // Use the active avatar as the sender
      const currentSender = activeAvatar.value === 'A' ? avatarA.value : avatarB.value;
      
      const message = await apiService.sendMessage({
        conversationId,
        content,
        type,
        replyTo
      });

      // Override the sender with the current active avatar
      message.sender = currentSender;

      // Add message to local store
      const conversation = conversations.value.find(c => c.id === conversationId);
      if (conversation) {
        conversation.messages.push(message);
      }

      // Emit socket event for real-time updates
      socketService.sendMessage({ ...message, conversationId });

      return message;
    } catch (error) {
      console.error('Failed to send message:', error);
      throw error;
    }
  };

  const addContact = async (contactId: number) => {
    try {
      await apiService.addContact(contactId);
      // Reload user data to get updated contacts
      if (user.value) {
        const userData = await apiService.getCurrentUser();
        user.value = userData;
      }
    } catch (error) {
      console.error('Failed to add contact:', error);
      throw error;
    }
  };

  const createConversation = async (type: string, participantIds: number[], name?: string, displayPhoto?: string, avatarA?: string, avatarB?: string) => {
    try {
      const result = await apiService.createConversation({
        type,
        name,
        participantIds,
        displayPhoto,
        avatarA,
        avatarB
      });
      
      // Reload conversations
      await loadConversations();
      
      return result;
    } catch (error) {
      console.error('Failed to create conversation:', error);
      throw error;
    }
  };

  const markMessageAsRead = async (messageId: number) => {
    try {
      await apiService.markMessageAsRead(messageId);
    } catch (error) {
      console.error('Failed to mark message as read:', error);
    }
  };

  const archiveConversation = async (conversationId: number, archived: boolean) => {
    try {
      await apiService.archiveConversation(conversationId, archived);
      
      // Move conversation between active and archived lists
      const conversation = conversations.value.find(c => c.id === conversationId);
      if (conversation && archived) {
        // Move to archived
        conversations.value = conversations.value.filter(c => c.id !== conversationId);
        archivedConversations.value.push(conversation);
      } else if (conversation && !archived) {
        // Move back to active (shouldn't happen often but handle it)
        archivedConversations.value = archivedConversations.value.filter(c => c.id !== conversationId);
        conversations.value.push(conversation);
      }
      
      // Also check archived list
      const archivedConv = archivedConversations.value.find(c => c.id === conversationId);
      if (archivedConv && !archived) {
        archivedConversations.value = archivedConversations.value.filter(c => c.id !== conversationId);
        conversations.value.push(archivedConv);
      }
      
    } catch (error) {
      console.error('Failed to archive conversation:', error);
      throw error;
    }
  };

  const loadArchivedConversations = async () => {
    try {
      console.log('Store: Loading archived conversations...');
      const data = await apiService.getArchivedConversations();
      console.log('Store: Received archived conversations:', data);
      archivedConversations.value = data;
    } catch (error) {
      console.error('Failed to load archived conversations:', error);
    }
  };

  const deleteConversation = async (conversationId: number) => {
    try {
      await apiService.deleteConversation(conversationId);
      
      // Remove from both lists
      conversations.value = conversations.value.filter(c => c.id !== conversationId);
      archivedConversations.value = archivedConversations.value.filter(c => c.id !== conversationId);
      
      // Clear active conversation if it was deleted
      if (conversationOpen.value === conversationId.toString()) {
        conversationOpen.value = undefined;
      }
    } catch (error) {
      console.error('Failed to delete conversation:', error);
      throw error;
    }
  };

  const deleteMessage = async (conversationId: number, messageId: number) => {
    try {
      await apiService.deleteMessage(messageId);
      
      // Remove from local store
      const conversation = conversations.value.find(c => c.id === conversationId) ||
                          archivedConversations.value.find(c => c.id === conversationId);
      if (conversation) {
        conversation.messages = conversation.messages.filter(m => m.id !== messageId);
      }
    } catch (error) {
      console.error('Failed to delete message:', error);
      throw error;
    }
  };

  const pinMessage = async (conversationId: number, messageId: number | null) => {
    try {
      await apiService.pinMessage(conversationId, messageId);
      
      // Update local store
      const conversation = conversations.value.find(c => c.id === conversationId) ||
                          archivedConversations.value.find(c => c.id === conversationId);
      if (conversation && messageId) {
        const message = conversation.messages.find(m => m.id === messageId);
        if (message) {
          conversation.pinnedMessage = message;
          conversation.pinnedMessageHidden = false;
        }
      } else if (conversation && messageId === null) {
        // Unpin
        conversation.pinnedMessage = undefined;
        conversation.pinnedMessageHidden = true;
      }
    } catch (error) {
      console.error('Failed to pin message:', error);
      throw error;
    }
  };

  // Initialize socket listeners
  const initializeSocketListeners = () => {
    socketService.onNewMessage((messageData) => {
      const conversation = conversations.value.find(c => c.id === messageData.conversationId);
      if (conversation) {
        conversation.messages.push(messageData);
      }
    });

    socketService.onUserTyping((data) => {
      // Handle typing indicators
      console.log('User typing:', data);
    });
  };

  // Auto-login if token exists
  const initializeAuth = async () => {
    if (apiService.isAuthenticated()) {
      try {
        const userData = await apiService.getCurrentUser();
        user.value = userData;
        
        const token = localStorage.getItem('auth_token');
        if (token) {
          socketService.connect(token);
          initializeSocketListeners();
          await loadConversations();
          await loadArchivedConversations();
        }
      } catch (error) {
        // Token is invalid, logout
        logout();
      }
    }
  };

  return {
    // status refs
    status,
    getStatus,

    // data refs
    user,
    conversations,
    contactGroups,
    notifications,
    archivedConversations,
    calls,
    settings,
    activeCall,
    recentEmoji,
    emojiSkinTone,

    // ui refs
    activeSidebarComponent,
    delayLoading,
    conversationOpen,
    callMinimized,
    openVoiceCall,

    // API methods
    login,
    register,
    logout,
    loadConversations,
    loadArchivedConversations,
    sendMessage,
    addContact,
    createConversation,
    archiveConversation,
    deleteConversation,
    deleteMessage,
    pinMessage,
    markMessageAsRead,
    initializeAuth,
    initializeSocketListeners,

    // Avatar management
    activeAvatar,
    avatarA,
    avatarB,
    toggleAvatar: () => {
      activeAvatar.value = activeAvatar.value === 'A' ? 'B' : 'A';
    },
    setActiveAvatar: (avatar: 'A' | 'B') => {
      activeAvatar.value = avatar;
    },
  };
});

export default useStore;
