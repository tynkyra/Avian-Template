// Generate a consistent color from a string (e.g., name or email)
export function stringToColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  let color = '#';
  for (let i = 0; i < 3; i++) {
    const value = (hash >> (i * 8)) & 0xff;
    color += ('00' + value.toString(16)).slice(-2);
  }
  return color;
}
import useStore from "@src/store/store";
import type {
  ICall,
  IContact,
  IConversation,
  IMessage,
  IRecording,
} from "@src/types";
import { useRoute } from "vue-router";

/**
 * combine first name and last name of a contact.
 * @param contact
 * @returns A string the combines the first and last names.
 */
export const getFullName = (contact: IContact, hyphen?: boolean) => {
  if (hyphen) {
    return contact.firstName + "-" + contact.lastName;
  } else {
    return contact.firstName + " " + contact.lastName;
  }
};

/**
 * get the other contact that is not the authenticated user.

/**
 * Get initials from conversation name
 * @param conversation
 * @returns String with initials (max 2 characters)
 */
export const getInitials = (conversation: IConversation) => {
  const name = getName(conversation);
  if (!name) return '';
  
  const words = name.trim().split(/\s+/);
  if (words.length === 1) {
    return words[0].substring(0, 2).toUpperCase();
  }
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
};

/**
 * @param conversation
 * @returns A contact object representing the other user in the conversation.
 */
export const getOddContact = (conversation: IConversation) => {
  const store = useStore();

  let oddContact;

  for (let contact of conversation.contacts) {
    if (store.user && contact.id !== store.user.id) {
      oddContact = contact;
    }
  }

  return oddContact;
};

/**
 * get avatar based on conversation type.
 * @param conversation
 * @returns A string representing the url to the avatar image
 */
// Helper to prefix avatar URLs with backend server address if needed
const AVATAR_BASE_URL = 'http://127.0.0.1:3003'; // Updated to match backend port
function fixAvatarUrl(url?: string) {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.startsWith('/avatars/')) return AVATAR_BASE_URL + url;
  return url;
}

export const getAvatar = (conversation: IConversation) => {
  if (!conversation) return '';
  if (conversation.type === 'self_chat') {
    return fixAvatarUrl((conversation as any)?.displayPhoto || '');
  }
  if (["group", "broadcast"].includes(conversation.type)) {
    return fixAvatarUrl((conversation as any)?.displayPhoto);
  } else {
    let oddContact = getOddContact(conversation);
    return fixAvatarUrl(oddContact?.avatar);
  }
};

/**
 * get name based on conversation type.
 * @param conversation
 * @returns String
 */
export const getName = (conversation: IConversation , hyphen?: boolean) => {
  if (!conversation) return '';
  
  // For self chats, always show the conversation name
  if (conversation.type === 'self_chat') {
    if (hyphen) {
      return (conversation.name as string).split(" ").join("-");
    } else {
      return conversation.name;
    }
  }
  
  if (["group", "broadcast"].includes(conversation.type)) {
    if (hyphen) {
      return (conversation.name as string).split(" ").join("-");
    } else {
      return conversation.name;
    }
  } else {
    let oddContact = getOddContact(conversation);
    if (oddContact) {
      return getFullName(oddContact, hyphen);
    }
  }
};

/**
 * trim a string when it reaches a certain length and adds three dots
 * at the end.
 * @param text
 * @param maxLength
 * @returns A string that is trimmed according the length provided
 */
export const shorten = (message: IMessage | string, maxLength: number = 23) => {
  let text: string | IRecording | undefined;

  if (typeof message === "string") {
    text = message;
  } else {
    text = message.content;
  }

  if (text && typeof text === "string") {
    let trimmedString = text;
    if (text.length > maxLength) {
      // trim the string to the maximum length.
      trimmedString = trimmedString.slice(0, maxLength);
      // add three dots to indicate that there is more to the message.
      trimmedString += "...";
    }
    return trimmedString;
  }

  return "";
};

/**
 * test if the message contains attachments
 * @param message
 * @returns A boolean indicating whether the message has attachments
 */
export const hasAttachments = (message: IMessage) => {
  let attachments = message.attachments;
  return attachments && attachments.length > 0;
};

/**
 * extract the id of the active conversaiton from the url
 */
export const getActiveConversationId = () => {
  const route = useRoute();
  return route.params.id ? Number(route.params.id) : undefined;
};

/**
 * get index of the conversation inside the conversations array
 * @param conversationId
 * @returns A number indicating the index of the conversation.
 */
export const getConversationIndex = (
  conversationId: number
): number | undefined => {
  let conversationIndex;
  const store = useStore();

  store.conversations.forEach((conversation, index) => {
    if (conversation.id === conversationId) {
      conversationIndex = index;
    }
  });

  return conversationIndex;
};

/**
 * takes a call object and returns all the members
 * of the call except the authenticated user.
 * @param call
 * @returns An array containing the contacts participating in the call
 */
export const getOtherMembers = (call: ICall) => {
  const store = useStore();
  let members = [];

  if (call) {
    for (let member of call.members) {
      if (store.user && member.id !== store.user.id) {
        members.push(member);
      }
    }
  }

  return members;
};

/**
 * takes a call object and returns a name for the call
 * @param call
 * @param full
 * @param maxLength
 * @returns A string representing name of the call.
 */
export const getCallName = (
  call: ICall,
  full?: boolean,
  maxLength: number = 20
) => {
  let members = getOtherMembers(call);
  let callName: string = "";

  for (let member of members) {
    callName += getFullName(member);

    if (members.length > 1) {
      callName += ", ";
    }
  }

  if (full) {
    return callName;
  } else {
    return shorten(callName, maxLength);
  }
};

export const getMessageById = (
  conversation?: IConversation,
  messageId?: number
) => {
  if (!conversation || !messageId) return undefined;
  return conversation.messages.find((message) => message.id === messageId);
};

/**
 * Convert unicode to native emoji
 *
 * @param unicode - emoji unicode
 */
export const unicodeToEmoji = (unicode: string) => {
  return unicode
    .split("-")
    .map((hex) => parseInt(hex, 16))
    .map((hex) => String.fromCodePoint(hex))
    .join("");
};
