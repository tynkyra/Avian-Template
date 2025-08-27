import { IContact } from "@src/types/contact";

//**** Types ****//

export interface IConversation {
  id: number;
  type: string;
  name?: string;
  avatar?: string;
  admins?: number[];
  contacts: IContact[];
  messages: IMessage[];
  pinnedMessage?: IMessage;
  pinnedMessageHidden?: boolean;
  replyMessage?: IMessage;
  unread?: number;
  draftMessage: string;
}

export interface IAttachment {
  id: number;
  type: string;
  name: string;
  size: string;
  url: string;
  thumbnail?: string;
  file?: File;
}

export interface IPreviewData {
  title: string;
  image?: string;
  description: string;
  domain: string;
  link: string;
}

export interface IMessage {
  id: number;
  type?: string;
  content?: string | IRecording;
  date: string;
  sender: IContact;
  replyTo?: number;
  previewData?: IPreviewData;
  attachments?: IAttachment[];
  state: string;
}

export interface IRecording {
  id: number;
  size: string;
  src: string;
  duration: string;
  file?: File;
}

export interface IEmoji {
  n: string[];
  u: string;
  r?: string;
  v?: string[];
}
