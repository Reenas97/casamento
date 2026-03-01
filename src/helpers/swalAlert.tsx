import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

const MySwal = withReactContent(Swal);

export const swalSuccess = (title: string, text?: string) => {
  return MySwal.fire({
    icon: "success",
    title,
    text,
    confirmButtonColor: "#EDC8FF",
  });
};

export const swalError = (title: string, text?: string) => {
  return MySwal.fire({
    icon: "error",
    title,
    text,
    confirmButtonColor: "#EDC8FF",
  });
};