import { Html, Head, Main, NextScript } from "next/document";
import type { DocumentContext, DocumentInitialProps } from "next/document";
import Document from "next/document";
import { getLocaleFromRequest, DEFAULT_LOCALE } from "@/lib/server/get-locale";

interface MyDocumentProps extends DocumentInitialProps {
  locale: string;
}

class MyDocument extends Document<MyDocumentProps> {
  static async getInitialProps(ctx: DocumentContext): Promise<MyDocumentProps> {
    const initialProps = await Document.getInitialProps(ctx);
    const locale = ctx.req ? getLocaleFromRequest(ctx.req) : DEFAULT_LOCALE;
    return { ...initialProps, locale };
  }

  render() {
    const { locale } = this.props;
    return (
      <Html lang={locale}>
        <Head />
        <body>
          <script
            dangerouslySetInnerHTML={{
              __html: `
                (function() {
                  try {
                    var theme = localStorage.getItem('theme') || 'dark';
                    document.documentElement.classList.add(theme);
                  } catch (e) {}
                })();
              `,
            }}
          />
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

export default MyDocument;
