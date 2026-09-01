export interface BaseResponse<T> {
  errorCode: string | null;
  message: string;
  result: T;
}
