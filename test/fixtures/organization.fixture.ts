import { BaseFixture } from './base.fixture';
import { MOCK_CONTACT_EMAILS } from '../mocks/location.mock';

/**
 * Mock object generator for Organization entity
 */
export class OrganizationFixture extends BaseFixture {
  name = 'NextGen Pharma Training (e2e Test)';
  posId = 208;
  pos = 'mjfreeway';
  posConfig = {
    apiKey: '',
    userId: 6025,
  };
  state = { id: 52 };
  contactName = 'Steve Zeller';
  contactEmail = MOCK_CONTACT_EMAILS[0];
}
