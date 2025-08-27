import { IContact } from "@src/types/contact";

//**** Types ****//

export interface IUser {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  avatar: string;
  token: string;
  lastSeen: Date;
  contacts: IContact[];
}
