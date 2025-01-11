interface BaseProps {
  name: string;
  label?: string;
  preview?: boolean;
  separated?: boolean;
}

interface HeaderItemProps extends BaseProps {
  header: true;
}

interface LinkItemProps extends BaseProps {
  header?: false;
  icon?: string;
  to?: string | object;
  children?: LinkItemProps[];
}

export type NavigationItemProps = LinkItemProps | HeaderItemProps;
