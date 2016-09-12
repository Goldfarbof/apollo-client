import mockNetworkInterface, {
  MockedResponse,
} from './mockNetworkInterface';

import mockQueryManager from './mockQueryManager';

import { ObservableQuery } from '../../src/ObservableQuery';

export default (...mockedResponses: MockedResponse[]) => {
  const queryManager = mockQueryManager(...mockedResponses);
  const firstRequest = mockedResponses[0].request;
  return queryManager.watchQuery({
    query: firstRequest.query,
    variables: firstRequest.variables,
  });
};
