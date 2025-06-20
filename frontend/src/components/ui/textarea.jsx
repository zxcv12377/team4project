// src/components/ui/textarea.jsx
export function Textarea({ ...props }) {
  return (
    <textarea
      className="w-full p-2 border rounded focus:outline-none focus:ring"
      {...props}
    />
  );
}