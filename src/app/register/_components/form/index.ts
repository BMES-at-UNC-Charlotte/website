import { createFormHook } from "@tanstack/react-form";

import {
  BooleanRadioField,
  CheckboxGroupField,
  RepresentativeField,
  TextareaField,
  TextField,
} from "./fields";
import { fieldContext, formContext } from "./contexts";

export const { useAppForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: {
    BooleanRadioField,
    CheckboxGroupField,
    RepresentativeField,
    TextareaField,
    TextField,
  },
  formComponents: {},
});
