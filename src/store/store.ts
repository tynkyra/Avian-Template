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
      
      // Backend already sorts by last_message_time DESC, so conversations with recent messages appear first
      // New conversations without messages will appear at the bottom (NULL last_message_time)
      conversations.value = data;
      status.value = "success";
    } catch (error) {
      console.error('Failed to load conversations:', error);
      status.value = "error";
    }
  };

  const sendMessage = async (conversationId: number, content: string, type = 'text', replyTo?: number) => {
    try {
      // Get the conversation to access its avatars
      const conversation = conversations.value.find(c => c.id === conversationId);
      if (!conversation) {
        console.error('Cannot send message: Conversation not found for id', conversationId);
        throw new Error('Conversation not found. Please try again after the chat appears in your list.');
      }

      // Get the avatar URL based on which avatar is active

      const avatarType = activeAvatar.value;
      const avatarUrl = avatarType === 'A' 
        ? (conversation as any)?.avatarA 
        : (conversation as any)?.avatarB;

      console.log('[Store] Sending message with avatarUrl:', avatarUrl, 'activeAvatar:', activeAvatar.value);
      console.log('[Store] Conversation avatarA:', (conversation as any)?.avatarA);
      console.log('[Store] Conversation avatarB:', (conversation as any)?.avatarB);


      const message = await apiService.sendMessage({
        conversationId,
        content,
        type,
        replyTo,
        avatarUrl, // Send the actual avatar URL
        avatarType // Add avatarType to message
      });

      // Add message to local store

      // Ensure avatarType is present in local message object
      message.avatarType = avatarType;
      conversation.messages.push(message);

      // Move conversation to the top of the list
      const index = conversations.value.indexOf(conversation);
      if (index > 0) {
        // Create a new array to trigger reactivity
        const updated = [...conversations.value];
        updated.splice(index, 1);
        updated.unshift(conversation);
        conversations.value = updated;
      }

      // Emit socket event for real-time updates
      socketService.sendMessage({ ...message, conversationId });

      return message;
    } catch (error) {
      console.error('Failed to send message:', error);
      throw error;
    }
  };

  const sendAttachments = async (conversationId: number, files: File[], caption?: string) => {
    try {
      // Get the conversation to access its avatars
      const conversation = conversations.value.find(c => c.id === conversationId);
      
      // Get the avatar URL based on which avatar is active
      const avatarUrl = activeAvatar.value === 'A' 
        ? (conversation as any)?.avatarA 
        : (conversation as any)?.avatarB;
      
      console.log('[Store] Sending attachments with avatarUrl:', avatarUrl);
      
      const message = await apiService.sendAttachments({
        conversationId,
        files,
        caption,
        avatarUrl
      });

      // Add message to local store
      if (conversation) {
        conversation.messages.push(message);
        
        // Move conversation to the top of the list
        const index = conversations.value.indexOf(conversation);
        if (index > 0) {
          const updated = [...conversations.value];
          updated.splice(index, 1);
          updated.unshift(conversation);
          conversations.value = updated;
        }
      }

      // Emit socket event for real-time updates
      socketService.sendMessage({ ...message, conversationId });

      return message;
    } catch (error) {
      console.error('Failed to send attachments:', error);
      throw error;
    }
  };

  const sendRecording = async (conversationId: number, audioFile: File, duration: string) => {
    try {
      // Get the conversation to access its avatars
      const conversation = conversations.value.find(c => c.id === conversationId);
      
      // Get the avatar URL based on which avatar is active
      const avatarUrl = activeAvatar.value === 'A' 
        ? (conversation as any)?.avatarA 
        : (conversation as any)?.avatarB;
      
      console.log('[Store] Sending recording with avatarUrl:', avatarUrl, 'duration:', duration);
      
      const message = await apiService.sendRecording({
        conversationId,
        audioFile,
        duration,
        avatarUrl
      });

      // Add message to local store
      if (conversation) {
        conversation.messages.push(message);
        
        // Move conversation to the top of the list
        const index = conversations.value.indexOf(conversation);
        if (index > 0) {
          const updated = [...conversations.value];
          updated.splice(index, 1);
          updated.unshift(conversation);
          conversations.value = updated;
        }
      }

      // Emit socket event for real-time updates
      socketService.sendMessage({ ...message, conversationId });

      return message;
    } catch (error) {
      console.error('Failed to send recording:', error);
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
      
      // Reload conversations to get the new conversation with messages
      await loadConversations();
      
      // Load messages for the new conversation
      if (result.id) {
        const response = await apiService.getMessages(result.id);
        const conversation = conversations.value.find(c => c.id === result.id);
        if (conversation) {
          conversation.messages = response.messages;
          
          // Populate pinned messages from pinnedMessageIds
          if (response.pinnedMessageIds && response.pinnedMessageIds.length > 0) {
            conversation.pinnedMessages = response.messages
              .filter(m => response.pinnedMessageIds.includes(m.id))
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          } else {
            conversation.pinnedMessages = [];
          }
          
          // Always sort self-chats by descending ID so newest is at the top
          conversations.value = [
            ...conversations.value
              .filter(c => c.type === 'self_chat')
              .sort((a, b) => b.id - a.id),
            ...conversations.value.filter(c => c.type !== 'self_chat')
          ];
        }
      }
      
      return result;
    } catch (error) {
      console.error('Failed to create conversation:', error);
      throw error;
    }
  };

  const updateConversation = async (conversationId: number, updates: {
    name?: string;
    displayPhoto?: string;
    avatarA?: string;
    avatarB?: string;
  }) => {
    try {
      const updatedConversation = await apiService.updateConversation(conversationId, updates);
      
      console.log('[Store] updateConversation - Updated conversation from API:', updatedConversation);
      
      // Update the conversation in the local store
      const index = conversations.value.findIndex(c => c.id === conversationId);
      if (index !== -1) {
        // Update specific fields to trigger reactivity
        if (updatedConversation.name !== undefined) {
          conversations.value[index].name = updatedConversation.name;
        }
        if (updatedConversation.displayPhoto !== undefined) {
          conversations.value[index].displayPhoto = updatedConversation.displayPhoto;
        }
        if (updatedConversation.avatarA !== undefined) {
          conversations.value[index].avatarA = updatedConversation.avatarA;
        }
        if (updatedConversation.avatarB !== undefined) {
          conversations.value[index].avatarB = updatedConversation.avatarB;
        }
        console.log('[Store] Updated conversation in active list:', conversations.value[index]);
      }
      
      // Also check archived conversations
      const archivedIndex = archivedConversations.value.findIndex(c => c.id === conversationId);
      if (archivedIndex !== -1) {
        if (updatedConversation.name !== undefined) {
          archivedConversations.value[archivedIndex].name = updatedConversation.name;
        }
        if (updatedConversation.displayPhoto !== undefined) {
          archivedConversations.value[archivedIndex].displayPhoto = updatedConversation.displayPhoto;
        }
        if (updatedConversation.avatarA !== undefined) {
          archivedConversations.value[archivedIndex].avatarA = updatedConversation.avatarA;
        }
        if (updatedConversation.avatarB !== undefined) {
          archivedConversations.value[archivedIndex].avatarB = updatedConversation.avatarB;
        }
        console.log('[Store] Updated conversation in archived list:', archivedConversations.value[archivedIndex]);
      }
      
      return updatedConversation;
    } catch (error) {
      console.error('Failed to update conversation:', error);
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
        conversations.value.unshift(conversation); // Add to beginning
        // Sort by last message time
        conversations.value.sort((a, b) => {
          const aLastMsg = a.messages[a.messages.length - 1];
          const bLastMsg = b.messages[b.messages.length - 1];
          if (!aLastMsg) return 1;
          if (!bLastMsg) return -1;
          return new Date(bLastMsg.date).getTime() - new Date(aLastMsg.date).getTime();
        });
      }
      
      // Also check archived list
      const archivedConv = archivedConversations.value.find(c => c.id === conversationId);
      if (archivedConv && !archived) {
        archivedConversations.value = archivedConversations.value.filter(c => c.id !== conversationId);
        conversations.value.unshift(archivedConv); // Add to beginning
        // Sort by last message time
        conversations.value.sort((a, b) => {
          const aLastMsg = a.messages[a.messages.length - 1];
          const bLastMsg = b.messages[b.messages.length - 1];
          if (!aLastMsg) return 1;
          if (!bLastMsg) return -1;
          return new Date(bLastMsg.date).getTime() - new Date(aLastMsg.date).getTime();
        });
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
          // Add to pinnedMessages array if not already there
          if (!conversation.pinnedMessages) {
            conversation.pinnedMessages = [];
          }
          if (!conversation.pinnedMessages.find(pm => pm.id === messageId)) {
            conversation.pinnedMessages.push(message);
            // Sort by message date (latest first)
            conversation.pinnedMessages.sort((a, b) => 
              new Date(b.date).getTime() - new Date(a.date).getTime()
            );
          }
        }
      } else if (conversation && messageId === null) {
        // Unpin all
        conversation.pinnedMessages = [];
      }
    } catch (error) {
      console.error('Failed to pin message:', error);
      throw error;
    }
  };

  const unpinMessage = async (conversationId: number, messageId: number) => {
    try {
      await apiService.unpinMessage(conversationId, messageId);
      
      // Update local store
      const conversation = conversations.value.find(c => c.id === conversationId) ||
                          archivedConversations.value.find(c => c.id === conversationId);
      if (conversation && conversation.pinnedMessages) {
        conversation.pinnedMessages = conversation.pinnedMessages.filter(pm => pm.id !== messageId);
      }
    } catch (error) {
      console.error('Failed to unpin message:', error);
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
    sendAttachments,
    sendRecording,
    addContact,
    createConversation,
    updateConversation,
    archiveConversation,
    deleteConversation,
    deleteMessage,
    pinMessage,
    unpinMessage,
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
