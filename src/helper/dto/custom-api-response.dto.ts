import { CustomErrorMessage } from './custom-error-message.dto';

export class CustomApiResponse {
  data: any;
  error: CustomErrorMessage | null = null;
}
