import Swal, { SweetAlertResult } from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

export const swal = withReactContent(Swal);

export function alertSuccess(
  title: string,
  msg?: string
): Promise<SweetAlertResult<any>> {
  return swal.fire({
    title: title,
    text: msg,
    icon: "success",
  });
}

export function alertInfo(
  title: string,
  msg?: string
): Promise<SweetAlertResult<any>> {
  return swal.fire({
    title: title,
    text: msg,
    icon: "info",
  });
}

export function alertWarn(
  title: string,
  msg?: string
): Promise<SweetAlertResult<any>> {
  return swal.fire({
    title: title,
    text: msg,
    icon: "warning",
  });
}

export function alertError(
  title: string,
  msg?: string
): Promise<SweetAlertResult<any>> {
  return swal.fire({
    title: title,
    text: msg,
    icon: "error",
  });
}
