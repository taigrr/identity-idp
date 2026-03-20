import type { ComponentType, FC } from 'react';

function withProps<TBound extends Record<string, unknown>>(boundProps: TBound) {
  return function <TProps>(
    Component: ComponentType<TProps>,
  ): FC<Omit<TProps, keyof TBound>> {
    return function WithBoundProps(props) {
      return <Component {...(boundProps as Partial<TProps>)} {...(props as TProps)} />;
    };
  };
}

export default withProps;
