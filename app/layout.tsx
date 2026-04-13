import type { Metadata } from "next";
import "./globals.css";
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "@/components/ui/sonner";
 import '@stream-io/video-react-sdk/dist/css/styles.css';
import 'react-datepicker/dist/react-datepicker.css';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Hello English",
  description: "Platformă pentru lecții video, grupe și resurse educaționale",
  icons:{
    icon: '/icons/logo.svg'
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ro">
      <ClerkProvider
      appearance = {{
        layout:{
          socialButtonsVariant:'iconButton',
        },
        variables:{
          colorText:'#17141f',
          colorPrimary:'#6465c8',
          colorBackground:'#ffffff',
          colorInputBackground:'#fff8f1',
          colorInputText:'#252a41',
          colorNeutral:'#eadfeb',
          colorDanger:'#df6f98',
          borderRadius:'18px',
          fontFamily:'DM Sans, sans-serif'
        },
        elements: {
          rootBox: "w-full",
          cardBox: "w-full shadow-none",
          card: "w-full rounded-[28px] border border-[#eadfeb] bg-white shadow-none",
          headerLogoBox: "hidden",
          headerTitle: "text-[28px] font-black tracking-[-0.03em] text-[#17141f]",
          headerSubtitle: "text-sm leading-6 text-[#75697c]",
          footer: "hidden",
          footerAction: "hidden",
          socialButtonsBlockButton:
            "rounded-2xl border border-[#eadfeb] bg-[#fff8f1] text-[#17141f] shadow-none hover:bg-[#ffeef4]",
          formButtonPrimary:
            "rounded-2xl bg-[#6465c8] text-white shadow-[0_14px_30px_rgba(100,101,200,0.28)] hover:bg-[#5557b8]",
          formFieldInput:
            "rounded-2xl border border-[#eadfeb] bg-[#fff8f1] text-[#17141f] shadow-none focus:border-[#6465c8] focus:ring-0",
          formFieldLabel: "text-xs font-bold uppercase tracking-[0.12em] text-[#75697c]",
          footerActionLink: "font-semibold text-[#6465c8] hover:text-[#4f50ab]",
          identityPreviewText: "text-[#17141f]",
          identityPreviewEditButton: "text-[#6465c8]",
          formResendCodeLink: "text-[#6465c8] hover:text-[#4f50ab]",
          otpCodeFieldInput:
            "rounded-2xl border border-[#eadfeb] bg-[#fff8f1] text-[#17141f] shadow-none focus:border-[#6465c8]",
          alert: "rounded-2xl border border-[#f0b3c7] bg-[#fff1f5] text-[#a04469]"
        },
      }}
      >
          <body className={`${inter.className} bg-dark-2`}>
            {children}
            <Toaster />
          </body>
      </ClerkProvider>
    </html>
  );
}
