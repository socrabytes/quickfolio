// React and Next.js type declarations
/*
declare module 'react' {
  export = React;
  export as namespace React;
  namespace React {
    type FC<P = {}> = React.FunctionComponent<P>;
    type ReactNode = React.ReactElement | string | number | boolean | null | undefined;
    interface FunctionComponent<P = {}> {
      (props: P): ReactElement | null;
    }
    interface ReactElement<P = any> {
      type: any;
      props: P;
      key: string | number | null;
    }
  }
}
*/

declare module 'next/link' {
  import { ReactNode } from 'react';
  
  export interface LinkProps {
    href: string;
    as?: string;
    replace?: boolean;
    scroll?: boolean;
    shallow?: boolean;
    passHref?: boolean;
    prefetch?: boolean;
    locale?: string | false;
    className?: string;
    children?: ReactNode;
  }
  
  export default function Link(props: LinkProps): JSX.Element;
}

declare module 'react-hook-form' {
  export function useForm<T = any>(options?: any): {
    register: (name: string, options?: any) => any;
    handleSubmit: (callback: (data: T) => void) => (event: any) => void;
    formState: {
      errors: Record<string, { message?: string }>;
    };
    reset: () => void;
  };
}

// Next.js App props
declare module 'next/app' {
  import { AppProps as NextAppProps } from 'next/app';
  export type AppProps = NextAppProps;
}

// TypeScript type for Next.js pages
declare module 'next' {
  export type NextPage<P = {}, IP = P> = React.FC<P>;
}

// CSS modules
declare module '*.css' {
  const classes: { [key: string]: string };
  export default classes;
}

// Image modules
declare module '*.png' {
  const content: string;
  export default content;
}

declare module '*.svg' {
  const content: string;
  export default content;
}

declare module '*.jpg' {
  const content: string;
  export default content;
}

declare module '*.jpeg' {
  const content: string;
  export default content;
}
