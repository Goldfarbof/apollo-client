// This simplified polyfill attempts to follow the ECMAScript Observable proposal.
// See https://github.com/zenparsing/es-observable

export type CleanupFunction = () => void;
export type SubscriberFunction<T> = (observer: Observer<T>) => (Subscription | CleanupFunction);

function isSubscription(subscription: Function | Subscription): subscription is Subscription {
  return (<Subscription>subscription).unsubscribe !== undefined;
}

export class Observable<T> {
  constructor(private subscriberFunction: SubscriberFunction<T>) {
  }

  public subscribe(observer: Observer<T>): Subscription {
    let subscriptionOrCleanupFunction = this.subscriberFunction(observer);

    if (isSubscription(subscriptionOrCleanupFunction)) {
      return subscriptionOrCleanupFunction;
    } else {
      return {
        unsubscribe: <CleanupFunction>subscriptionOrCleanupFunction,
      };
    }
  }
}

export interface Observer<T> {
  next?: (value: T) => void;
  error?: (error: Error) => void;
  complete?: () => void;
}

export interface Subscription {
  unsubscribe: CleanupFunction
}
