import { IContact } from "@src/types/contact";

//**** Types ****//

export interface ICall {
  type: string;
  direction: string;
  status: string;
  date: string;
  length: string;
  members: IContact[];
  adminIds: number[];
}
