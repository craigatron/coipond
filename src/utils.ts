import { enqueueSnackbar } from "notistack";

export const successSnack = (msg: string) => {
  enqueueSnackbar(msg, {
    variant: "success",
    anchorOrigin: { vertical: "top", horizontal: "center" },
  });
};

export const errorSnack = (msg: string) => {
  enqueueSnackbar(msg, {
    variant: "error",
    anchorOrigin: { vertical: "top", horizontal: "center" },
  });
};
