/**
 * The options for listing emails.
 */
export interface ListEmailOptions {
  /**
   * The number of emails to skip.
   */
  skip?: number;
  /**
   * The number of emails to take.
   */
  take?: number;
  /**
   * The sort order to use for the emails.
   */
  sort?: 'asc' | 'desc';
  /**
   * The search query to use for the emails.
   */
  search?: string;
  /**
   * The read/unread status to filter the emails by.
   */
  unread?: boolean;
}

/**
 * The email data.
 */
export interface EmailData {
  /**
   * The ID of the email.
   */
  id: string;
  /**
   * The from address of the email.
   */
  from: string;
  /**
   * The to addresses of the email.
   */
  to: string;
  /**
   * The subject of the email.
   */
  subject: string;
  /**
   * The HTML body of the email.
   */
  html: string;
  /**
   * The text body of the email.
   */
  text: string;
  /**
   * The CC addresses of the email.
   */
  cc: string | null;
  /**
   * The read/unread status of the email.
   */
  unread: boolean;
  /**
   * The timestamp of the email.
   */
  timestamp: Date;
  /**
   * The date and time the email was created.
   */
  createdAt: Date;
  /**
   * The date and time the email was last updated.
   */
  updatedAt: Date;
}
