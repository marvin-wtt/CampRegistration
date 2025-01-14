interface BaseProps {
  header?: boolean;
  name: string;
  label?: string | undefined;
  preview?: boolean | undefined;
  separated?: boolean | undefined;
  insertLevel?: number | undefined;
}

interface HeaderItemProps extends BaseProps {
  header: true;
}

interface LinkItemProps extends BaseProps {
  icon?: string | undefined;
  to?: string | object | undefined;
  children?: LinkItemProps[] | undefined;
}

export type NavigationItemProps = LinkItemProps | HeaderItemProps;
