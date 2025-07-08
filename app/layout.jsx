import './globals.css';

export const metadata = {
  title: 'AI Multi-Model Chatbot',
  description: 'A starter template for AI chatbot supporting multiple models',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="relative min-h-screen bg-gradient-to-br from-[#f3f4f6] via-[#f9fafb] to-[#fff] text-gray-900">
        {children}
      </body>
    </html>
  );
} 