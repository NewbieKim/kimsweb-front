import {Radio} from "@heroui/radio";
import { cn } from "@heroui/theme";

export const CustomRadio = (props: any) => {
  const {children, ...otherProps} = props;

  return (
    // 左对齐
    <Radio
      {...otherProps}
      classNames={{
        base: cn(
          "inline-flex m-0 justify-start", 
          "cursor-pointer rounded-lg gap-1 px-3 py-1.5 border-2 border-gray-200",
          "bg-white hover:bg-gray-50 transition-all duration-200",
          "data-[selected=true]:border-primary-500 data-[selected=true]:bg-primary-50",
        ),
        wrapper: "hidden",
        labelWrapper: "m-0 ml-0",
        label: "text-sm font-medium text-gray-700",
        description: "hidden",
      }}
    >
      {children}
    </Radio>
  );
};