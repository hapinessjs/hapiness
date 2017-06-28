export enum LifecycleHooksEnum {
    OnPreAuth = <any>'onPreAuth',
    OnPostAuth = <any>'onPostAuth',
    OnPreHandler = <any>'onPreHandler',
    OnPostHandler = <any>'onPostHandler',
    OnPreResponse = <any>'onPreResponse'
}

export enum LifecycleEventsEnum {
    OnPreAuth = <any>'onPreAuth',
    OnPostAuth = <any>'onPostAuth',
    OnPreHandler = <any>'onPreHandler',
    OnPostHandler = <any>'onPostHandler',
    OnPreResponse = <any>'onPreResponse'
}

export enum LifecycleComponentEnum {
    OnEvent = <any>'onEvent'
}

export enum RouteMethodsEnum {
    OnGet =  <any>'onGet',
    OnPost =  <any>'onPost',
    OnPut =  <any>'onPut',
    OnDelete =  <any>'onDelete',
    OnPatch =  <any>'onPatch',
    OnOptions =  <any>'onOptions'
}

export function enumByMethod(method: string): RouteMethodsEnum {
    switch (method) {
      case 'get':
        return RouteMethodsEnum.OnGet;
      case 'post':
        return RouteMethodsEnum.OnPost;
      case 'put':
        return RouteMethodsEnum.OnPut;
      case 'patch':
        return RouteMethodsEnum.OnPatch;
      case 'options':
        return RouteMethodsEnum.OnOptions;
      case 'delete':
        return RouteMethodsEnum.OnDelete;
      default:
        throw new Error('Method does not exist');
    }
}
