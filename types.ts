
export interface FormData {
  photo_style: string;
  background: string;
  angle: string;
  color_tone: string;
  depth_of_field: string;
  props: string;
  output_type: string;
}

export type FormField = {
  id: keyof FormData;
  label: string;
  description: string;
  type: 'textarea' | 'select';
  placeholder?: string;
  options?: string[];
  defaultValue: string;
};