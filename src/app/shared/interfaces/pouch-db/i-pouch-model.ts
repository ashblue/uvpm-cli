export interface IPouchModel {
  _id?: string;
  _rev?: string;
  _attachments?: {
    [file: string]: {
      content_type: string;
      data: Buffer;
    };
  };
}
