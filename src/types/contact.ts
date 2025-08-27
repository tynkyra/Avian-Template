//**** Types ****//

export interface IContact {
  id: number;
  firstName: string;
  lastName: string;
  avatar: string;
  email: string;
  lastSeen: Date;
}

export interface IContactGroup {
  letter: string;
  contacts: IContact[];
}
