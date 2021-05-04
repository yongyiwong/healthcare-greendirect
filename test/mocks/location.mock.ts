import * as faker from 'faker';

import { TestingModule } from '@nestjs/testing';
import { LocationRating } from '../../src/entities/location-rating.entity';
import { Location } from '../../src/entities/location.entity';
import { Organization } from '../../src/entities/organization.entity';
import { Product } from '../../src/entities/product.entity';
import { User } from '../../src/entities/user.entity';
import { LocationService } from '../../src/location/location.service';
import { OrganizationService } from '../../src/organization/organization.service';
import { ProductService } from '../../src/product/product.service';
import { UserService } from '../../src/user';
import { LocationDeliveryHour } from '../../src/entities/location-delivery-hour.entity';
import { LocationHour } from '../../src/entities/location-hour.entity';
import { HoursService } from '../../src/location/hours/hours.service';
import { MOCK_LOCALSTACK_TOPIC_ARN } from './localstack.mock';

export const FREEWAY_ORGANIZATIONS = [
  {
    posId: 1027,
    name: 'MJ Sinesemilla Location',
  },
];

export const BIOTRACK_ORGANIZATIONS = [
  {
    posId: 1001,
    name: 'Biotrack Cannacity Clinic Location',
  },
];

export const MOCK_STORE_HOURS = [0, 1, 2, 3, 4, 5, 6].map(day => ({
  dayOfWeek: day, //  0-6 starts on Sunday
  isOpen: true,
  startTime: '00:00:00',
  endTime: '23:55:00',
})) as LocationHour[];

export const MOCK_DELIVERY_HOURS = [0, 1, 2, 3, 4, 5, 6].map(day => ({
  dayOfWeek: day, //  0-6 starts on Sunday
  isOpen: true,
  startTime: '00:00:00',
  endTime: '23:55:00',
})) as LocationDeliveryHour[];

// MON-FRI 12PM to 6:30PM
const CONDADO_TORRIMAR_DELIVERY_HOURS = [1, 2, 3, 4, 5].map(day => ({
  dayOfWeek: day, // 0-6 starts on Sunday
  isOpen: true,
  startTime: '12:00:00',
  endTime: '18:30:00',
})) as LocationDeliveryHour[];

const NEXTGEN_DELIVERY_HOURS = [1, 2, 3, 4, 5].map(day => ({
  dayOfWeek: day, // 0-6 starts on Sunday
  isOpen: true,
  startTime: '09:00:00',
  endTime: '15:30:00',
})) as LocationDeliveryHour[];

export const MOCK_BILLING_EMAIL = 'isbxmail+billing@gmail.com';
export const MOCK_CONTACT_EMAILS = [
  'isbxmail+gd.test1@gmail.com',
  'isbxmail+gd.test2@gmail.com',
  'isbxmail+gd.test3@gmail.com',
  'isbxmail+gd.test4@gmail.com',
  'isbxmail+gd.test5@gmail.com',
  'isbxmail+btadmin@gmail.com',
  'isbxmail+mjadmin@gmail.com',
];
const LOCATION_DATA = [
  {
    name: 'NextGen Pharma',
    posId: 207,
    pos: 'mjfreeway',
    posConfig: {
      apiKey: '',
      userId: 6024,
    },
    state: { id: 52 },
    contactName: 'Steve Zeller',
    contactEmail: MOCK_CONTACT_EMAILS[0],
    contactPhone: '5555512312',
    locations: [
      {
        name: 'NextGen Dispensary',
        posId: 452,
        addressLine1: 'Calle A',
        city: 'Toa Baja',
        state: { id: 52 },
        postalCode: '00949',
        isDeliveryAvailable: true,
        deliveryMileRadius: 5,
        deliveryHours: NEXTGEN_DELIVERY_HOURS,
        longLat: '(-66.2557803,18.4459171)',
        timezone: 'America/Puerto_Rico',
        products: [
          {
            name: 'NG Prod 1',
            description: 'Weight product',
            category: 'Some Category',
            isInStock: true,
            strainName: 'Chorva',
            pricingType: 'weight',
            pricing: {
              price: 7.99,
              weightPrices: [
                { name: '1/8oz', price: 39.99 },
                { name: '1/4oz', price: 79.99 },
                { name: '1/2oz', price: 99.99 },
                { name: '1oz', price: 129.99 },
              ],
            },
          },
          {
            name: 'NG Out Stock Prod 2',
            description: 'Weight product',
            category: 'Some Category',
            isInStock: false,
            strainName: 'Chorva',
            pricingType: 'weight',
            pricing: {
              price: 7.99,
              weightPrices: [
                { name: '1g', price: 29.99 },
                { name: '2g', price: 49.99 },
                { name: '1/8oz', price: 99.99 },
              ],
            },
          },
        ],
      },
      {
        name: 'BWell Torrimar',
        posId: 453,
        addressLine1: 'Torrimar Shopping Center, Local 7',
        addressLine2: '1922 Avenida Ramírez de Arellano',
        city: 'Guaynabo',
        state: { id: 52 },
        postalCode: '00966',
        isDeliveryAvailable: true,
        deliveryMileRadius: 5,
        deliveryHours: CONDADO_TORRIMAR_DELIVERY_HOURS,
        longLat: '(-66.1204234,18.3910583)',
        timezone: 'America/Puerto_Rico',
        products: [
          {
            posId: 734090,
            name: 'Gummy Mango 25Mg',
            description: '',
            category: 'Infused Edible',
            subcategory: 'Edibles',
            isInStock: true,
            isMedicated: false,
            strainId: 87525,
            strainName: 'Mixed',
            pricingType: 'unit',
            pricing: {
              id: 3507,
              price: 6,
              pricingGroupName: null,
              weightPrices: [],
            },
          },
        ],
      },
      {
        name: 'BWell Ocean',
        posId: 2052,
        addressLine1: '1860 Calle McLeary',
        city: 'San Juan',
        state: { id: 52 },
        postalCode: '00911',
        isDeliveryAvailable: true,
        deliveryMileRadius: 5,
        longLat: '(-66.0591951,18.4524151)',
        timezone: 'America/Puerto_Rico',
        products: [
          {
            name: 'Balanced - Matador - Syringe',
            description: 'This product is sold by weight',
            category: 'Cartridges / Pens',
            isInStock: true,
            strainName: 'Matador',
            pricingType: 'weight',
            pricing: {
              price: 9.99,
              weightPrices: [
                { name: '1g', price: 9.99 },
                { name: '2g', price: 19.99 },
                { name: '1/8oz', price: 39.99 },
                { name: '1/4oz', price: 79.99 },
                { name: '1/2oz', price: 99.99 },
                { name: '1oz', price: 129.99 },
              ],
            },
          },
          {
            name: 'Active - Mango Haze - Cartridge 500 Mg',
            description:
              'This product is sold by weight. There is only 3 weight prices available.',
            category: 'Cartridges / Pens',
            isInStock: true,
            strainName: 'Mango Haze',
            pricingType: 'weight',
            pricing: {
              price: 29.99,
              weightPrices: [
                { name: '1g', price: 29.99 },
                { name: '2g', price: 49.99 },
                { name: '1/8oz', price: 99.99 },
              ],
            },
          },
          {
            name: 'Ambulance Cbd - Hibrido - Wax',
            description: 'This product has no weight prices.',
            category: 'Product Category',
            isInStock: true,
            strainName: 'Sativa',
            pricingType: 'unit',
            pricing: {
              price: 30.25,
            },
          },
          {
            name: 'Gummy Coco 25Mg',
            description: 'This  product has no pricing yet.',
            category: 'Infused Edible',
            isInStock: true,
            strainName: 'Tangerine Kush',
            pricingType: 'unit',
            pricing: null,
          },
          {
            name: 'Out Stock Product 5',
            description: 'This product is never in stock',
            category: 'Some Category',
            isInStock: false,
            strainName: 'Unknown',
            pricingType: 'weight',
            pricing: {
              price: 2000,
            },
          },
          {
            name: 'Product 6 unpriced',
            description: 'This  product has no pricing too.',
            category: 'Product Category',
            isInStock: true,
            strainName: 'Eklavu',
            pricingType: 'unit',
          },
        ],
      },
      {
        name: 'BWell Old San Juan',
        posId: 2053,
        addressLine1: 'Puerto Rico 1',
        city: 'San Juan',
        state: { id: 52 },
        postalCode: '00901',
        isDeliveryAvailable: true,
        deliveryMileRadius: 5,
        longLat: '(-66.1135839,18.4641347)',
        timezone: 'America/Puerto_Rico',
      },
      {
        name: 'BWell Condado',
        posId: 2052,
        addressLine1: '1102 Av Magdalena',
        city: 'San Juan',
        state: { id: 52 },
        postalCode: '00907',
        isDeliveryAvailable: true,
        deliveryMileRadius: 5,
        deliveryHours: CONDADO_TORRIMAR_DELIVERY_HOURS,
        longLat: '(-66.0747445,18.4571057)',
        timezone: 'America/Puerto_Rico',
        products: [
          {
            name: 'Condado Syringe',
            description: 'This product is sold by weight',
            category: 'Cartridges / Pens',
            isInStock: true,
            strainName: 'Matador',
            pricingType: 'weight',
            pricing: {
              price: 9.99,
              weightPrices: [
                { name: '1g', price: 9.99 },
                { name: '1/2oz', price: 80.99 },
                { name: '1oz', price: 24.99 },
              ],
            },
          },
          {
            name: 'Condado Prod 500 Mg',
            description:
              'Sold by weight. There is only 3 weight prices available.',
            category: 'Toys',
            isInStock: true,
            strainName: 'Mango Moin',
            pricingType: 'weight',
            pricing: {
              price: 29.99,
              weightPrices: [
                { name: '1g', price: 59.99 },
                { name: '2g', price: 61.99 },
                { name: '1/5oz', price: 75.0 },
              ],
            },
          },
        ],
      },
    ],
  },
  {
    name: 'Test Pharma Training',
    pos: 'mjfreeway',
    posConfig: {
      apiKey: '',
      userId: 6025,
    },
    state: { id: 52 },
    contactName: 'Steve Zeller',
    contactEmail: MOCK_CONTACT_EMAILS[0],
    contactPhone: '5555512312',
    locations: [
      {
        name: 'Dispensary No Delivery',
        posId: 455,
        addressLine1: 'Calle A',
        city: 'Toa Baja',
        state: { id: 52 },
        postalCode: '00949',
        longLat: '(-66.2557803,18.4459171)',
        timezone: 'America/Puerto_Rico',
        products: [
          {
            posId: 734142,
            name: 'Relaxed - Northern Lights 15Ml Tincture',
            description: '',
            category: 'Infused Edible',
            subcategory: 'Tinctures',
            isInStock: true,
            isMedicated: false,
            strainId: 76906,
            strainName: 'Northern Lights',
            pricingType: 'unit',
            pricing: {
              price: 45,
              pricingGroupName: null,
              weightPrices: [],
            },
          },
        ],
      },
      {
        name: 'Retail 2 Training',
        posId: 456,
        addressLine1: 'Torrimar Shopping Center, Local 7',
        addressLine2: '1922 Avenida Ramírez de Arellano',
        city: 'Guaynabo',
        state: { id: 52 },
        postalCode: '00966',
        longLat: '(-66.1204234,18.3910583)',
        timezone: 'America/Puerto_Rico',
      },
    ],
  },
  {
    name: 'Clinica Verde (test)',
    posId: 1042,
    pos: 'mjfreeway',
    posConfig: {
      apiKey: '',
      userId: 6024,
    },
    contactName: 'Marco',
    contactEmail: MOCK_CONTACT_EMAILS[1],
    contactPhone: '5555512310',
    textTopicArn:
      'arn:aws:sns:us-west-2:123456789012:' + MOCK_LOCALSTACK_TOPIC_ARN.CV,
    stripeReceiptEmail: MOCK_BILLING_EMAIL,
    locations: [
      {
        name: 'ISBX (e2e location test)',
        isDeliveryAvailable: true,
        deliveryMileRadius: 7,
        description:
          'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
        thumbnail: 'https://placekitten.com/200/200',
        sitePhoto: 'https://placekitten.com/375/330',
        longLat: '(-118.424138,34.020575)',
        timezone: 'America/Los_Angeles',
        addressLine1: '3415 S. Sepulveda Blvd Ste 1250',
        city: 'Los Angeles',
        state: { id: 5 },
        postalCode: '90034',
        ratings: [
          {
            user: { email: 'user_e2e@isbx.com' },
            rating: 5,
            review: 'Amazing company.',
          },
        ],
        products: [
          {
            name: 'Product Zero Price 1 (Unit Price)',
            description: 'This product is sold by unit',
            category: 'Product Category',
            isInStock: true,
            strainName: 'Sativa',
            pricingType: 'unit',
            pricing: {
              price: 0,
              weightPrices: [],
            },
          },
          {
            name: 'Product Zero Price 2 (Unit Price)',
            description: 'This product is sold by unit',
            category: 'Product Category',
            isInStock: true,
            strainName: 'Sativa',
            pricingType: 'unit',
            pricing: {
              price: 0,
              weightPrices: [],
            },
          },
          {
            name: 'Product Zero Price 3 (Weight Price)',
            description: 'This product is sold by weight',
            category: 'Product Category',
            isInStock: true,
            strainName: 'Sativa',
            pricingType: 'weight',
            pricing: {
              price: 9.99,
              weightPrices: [
                { name: '1g', price: 0 },
                { name: '2g', price: 19.99 },
                { name: '1/8oz', price: 39.99 },
              ],
            },
          },
          {
            name: 'Product Zero Price 4 (Weight Price)',
            description: 'This product is sold by weight',
            category: 'Product Category',
            isInStock: true,
            strainName: 'Sativa',
            pricingType: 'weight',
            pricing: {
              price: 9.99,
              weightPrices: [
                { name: '1g', price: 99.99 },
                { name: '2g', price: 29.99 },
                { name: '1/8oz', price: 0 },
              ],
            },
          },
          {
            name: 'Product 1',
            description: 'This product is sold by weight',
            category: 'Product Category',
            isInStock: true,
            strainName: 'Sativa',
            pricingType: 'weight',
            pricing: {
              price: 9.99,
              weightPrices: [
                { name: '1g', price: 9.99 },
                { name: '2g', price: 19.99 },
                { name: '1/8oz', price: 39.99 },
                { name: '1/4oz', price: 79.99 },
                { name: '1/2oz', price: 99.99 },
                { name: '1oz', price: 129.99 },
              ],
            },
          },
          {
            name: 'Product 2',
            description:
              'This product is sold by weight. There is only 3 weight prices available.',
            category: 'Product Category',
            isInStock: true,
            strainName: 'Sativa',
            pricingType: 'weight',
            pricing: {
              price: 29.99,
              weightPrices: [
                { name: '1g', price: 29.99 },
                { name: '2g', price: 49.99 },
                { name: '1/8oz', price: 99.99 },
              ],
            },
          },
          {
            name: 'Product 3 unit price',
            description: 'This product is priced by unit',
            category: 'P3 UNIT',
            isInStock: true,
            strainName: 'Sativa',
            pricingType: 'unit',
            pricing: {
              price: 30.25,
            },
          },
          {
            name: 'Product 3 No weight price',
            description:
              'This product is weight-priced but no weight prices (default to unit).',
            category: 'P3 WEIGHT',
            isInStock: true,
            strainName: 'Chorva',
            pricingType: 'weight',
            pricing: {
              price: 40.99,
            },
          },
          {
            name: 'Product 4 No price',
            description: 'This  product has no pricing yet.',
            category: 'Product Category',
            isInStock: true,
            strainName: 'Sativa',
            pricingType: 'unit',
            pricing: null,
          },
          {
            name: 'Out Stock Product 5',
            description: 'This product is never in stock',
            category: 'Some Category',
            isInStock: false,
            strainName: 'Unknown',
            pricingType: 'weight',
            pricing: {
              price: 2000,
            },
          },
          {
            name: 'Hidden Product',
            description: '',
            category: 'Hidden Category',
            isInStock: true,
            hidden: true,
            strainName: 'Suresa Sati',
            pricingType: 'unit',
            pricing: {
              price: 1.0,
            },
          },
        ],
      },
      {
        name: 'CVS (e2e location test)',
        isDeliveryAvailable: true,
        deliveryMileRadius: 7,
        description:
          'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
        thumbnail: 'https://placekitten.com/202/202',
        sitePhoto: 'https://placekitten.com/376/331',
        longLat: '(-118.422348, 34.020351)',
        timezone: 'America/Los_Angeles',
        addressLine1: '3458 S Sepulveda Blvd',
        city: 'Los Angeles',
        state: { id: 5 },
        postalCode: '90034',
        ratings: [
          {
            user: { email: 'admin_e2e@isbx.com' },
            rating: 3.5,
            review:
              'My order got fulfilled on time, but parking was kind of bad.',
          },
          {
            user: { email: 'user_e2e@isbx.com' },
            rating: 1,
            review:
              'I had a poor experience with the checkout process. There was a lot of people there.',
          },
        ],
        products: [
          {
            name: 'CVS Product',
            description: '',
            category: 'Test Category',
            isInStock: true,
            strainName: 'Sassa',
            pricingType: 'unit',
            pricing: {
              price: 100,
            },
          },
        ],
      },
      {
        name: `ForeverClosed`,
        isDeliveryAvailable: false,
        deliveryMileRadius: 7,
        description:
          'This location has no hours and never open, so cant submit orders here',
        thumbnail: `https://placekitten.com/100/111`,
        sitePhoto: 'https://placekitten.com/377/332',
        timezone: 'America/Puerto_Rico',
        addressLine1: 'Calle 4444',
        city: 'San Juan',
        postalCode: '0000',
        hours: [], // skipped by this.setupHour()
        products: [
          {
            name: 'ForeverClosedProduct',
            description:
              'This product is ok but cant be bought (location closed)',
            category: 'Rare',
            isInStock: true,
            strainName: 'Sure Sati',
            pricingType: 'unit',
            pricing: {
              price: 0.1,
            },
          },
        ],
      },
      {
        name: 'Burger King (e2e location test)',
        isDeliveryAvailable: true,
        deliveryMileRadius: 7,
        description:
          'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
        thumbnail: 'https://placekitten.com/210/210',
        sitePhoto: 'https://placekitten.com/378/333',
        longLat: '(-118.421302,34.018878)',
        timezone: 'America/Los_Angeles',
        addressLine1: '3520 S Sepulveda Blvd',
        city: 'Los Angeles',
        state: { id: 5 },
        postalCode: '90034',
      },
      {
        name: 'Westfield Century City (e2e location test)',
        isDeliveryAvailable: true,
        deliveryMileRadius: 7,
        longLat: '(-118.4207855,34.0583391)',
        timezone: 'America/Los_Angeles',
        addressLine1: '10250 Santa Monica Blvd',
        city: 'Los Angeles',
        state: { id: 5 },
        postalCode: '90067',
      },
    ],
  },
  {
    name: 'New Org No Location',
    contactName: 'Vesuvius',
    contactEmail: MOCK_CONTACT_EMAILS[2],
    contactPhone: '5555512315',
    locations: [],
  },
  {
    name: 'PH Location (No Delivery)',
    description: 'For testing GPS road distance',
    contactName: 'Kalbis',
    contactEmail: MOCK_CONTACT_EMAILS[3],
    contactPhone: '000000000',
    textTopicArn:
      'arn:aws:sns:us-west-2:123456789012:' + MOCK_LOCALSTACK_TOPIC_ARN.PH,
    locations: [
      {
        name: 'Tondo Giver',
        posId: 111,
        isDeliveryAvailable: false,
        addressLine1: 'New Manila',
        city: 'San Juan',
        state: null,
        postalCode: '0000',
        longLat: '(121.034682,14.613411)',
        timezone: 'Asia/Manila',
      },
      {
        name: 'Rizal Crossing Shop',
        posId: 112,
        isDeliveryAvailable: true,
        deliveryMileRadius: 20,
        addressLine1: 'Origas Ave',
        city: 'Cainta',
        state: null,
        postalCode: '0000',
        longLat: '(121.133478,14.580514)',
        timezone: 'Asia/Manila',
        products: [
          {
            name: 'Rizal Rapsa',
            description: '',
            category: 'Rare',
            isInStock: true,
            strainName: 'Suresa Sati',
            pricingType: 'unit',
            pricing: {
              price: 1.0,
            },
          },
        ],
      },
      {
        name: 'PH Streetwise',
        posId: 122,
        isDeliveryAvailable: false,
        addressLine1: 'EDSA',
        city: 'Mandaluyong',
        state: null,
        postalCode: '0000',
        longLat: '(121.045916,14.565263)',
        timezone: 'Asia/Manila',
      },
    ],
  },
  {
    name: 'Cannacity Training Org',
    state: { id: 52 },
    contactEmail: MOCK_CONTACT_EMAILS[1],
    contactName: faker.name.findName(),
    contactPhone: '5555510000',
    posId: BIOTRACK_ORGANIZATIONS[0].posId,
    pos: 'biotrack',
    posConfig: {
      apiKey: '',
      userId: 6020,
    },
    locations: [
      {
        name: 'Cannacity Shop',
        posId: faker.random.number(2000),
        addressLine1: 'Kalye West',
        city: 'San Juan',
        state: { id: 52 },
        postalCode: '00949',
        longLat: '(-66.2557600,18.4459171)',
        timezone: 'America/Puerto_Rico',
        products: [
          {
            posId: null,
            name: 'Product Custom Image',
            description:
              'A product with a manually uploaded image and thumbnail.',
            category: 'Lotion',
            subcategory: 'Tinctures',
            isInStock: true,
            isMedicated: true,
            strainId: 8000,
            strainName: 'TestStrain',
            pricingType: 'unit',
            pricing: {
              price: 75,
              pricingGroupName: null,
              weightPrices: [],
            },
          },
        ],
      },
      {
        name: 'Cannacity Clinic',
        posId: faker.random.number(2000),
        addressLine1: 'Kalye West 2',
        addressLine2: '1922 Avenida Roponggi',
        city: 'Guaynabo',
        state: { id: 52 },
        postalCode: '00966',
        longLat: '(-66.1204234,18.3910580)',
        timezone: 'America/Puerto_Rico',
        products: [
          {
            posId: null,
            name: 'Another Product Custom Image',
            description:
              'A product with a manually uploaded image and thumbnail.',
            category: 'Candy',
            subcategory: 'Jawbreaker',
            isInStock: true,
            isMedicated: true,
            strainId: 8001,
            strainName: 'TestStrain2',
            pricingType: 'unit',
            pricing: {
              price: 80.5,
              pricingGroupName: null,
              weightPrices: [],
            },
          },
        ],
      },
    ],
  },
  {
    name: 'Leafwell Org',
    state: { id: 52 },
    contactName: 'Shayne Everett',
    contactEmail: MOCK_CONTACT_EMAILS[3],
    contactPhone: '5555510000',
    locations: [
      {
        name: 'Leafwell Shop',
        posId: null,
        addressLine1: 'Paseo de La Princesa',
        city: 'San Juan',
        state: { id: 52 },
        postalCode: '00901',
        longLat: '(-66.118064,18.463258)',
        timezone: 'America/Puerto_Rico',
        products: [
          {
            posId: null,
            name: 'Leafwell Product Custom Image',
            description:
              'A product with a manually uploaded image and thumbnail.',
            category: 'Some Category',
            subcategory: 'Tinctures',
            isInStock: true,
            isMedicated: true,
            strainId: 8000,
            strainName: 'TestStrain',
            pricingType: 'unit',
            pricing: {
              price: 75,
              pricingGroupName: null,
              weightPrices: [],
            },
          },
        ],
      },
      {
        name: 'Leafwell Clinic',
        posId: 456,
        addressLine1: 'Calle San Sebastian',
        city: 'San Juan',
        state: { id: 52 },
        postalCode: '00901',
        longLat: '(-66.11754,18.467448)',
        timezone: 'America/Puerto_Rico',
        products: [
          {
            posId: null,
            name: 'Another Leafwell Product Custom Image',
            description:
              'A product with a manually uploaded image and thumbnail.',
            category: 'Chips',
            subcategory: 'Jawbreaker',
            isInStock: true,
            isMedicated: true,
            strainId: 8001,
            strainName: 'TestStrain2',
            pricingType: 'unit',
            pricing: {
              price: 80.5,
              pricingGroupName: null,
              weightPrices: [],
            },
          },
        ],
      },
    ],
  },
  {
    name: 'Pura Cepa Org',
    state: { id: 52 },
    contactName: 'Yasmine Mcgill',
    contactEmail: MOCK_CONTACT_EMAILS[4],
    contactPhone: '5555510000',
    locations: [
      {
        name: 'Pura Cepa Shop',
        posId: null,
        addressLine1: 'Paseo Covadonga',
        city: 'San Juan',
        state: { id: 52 },
        postalCode: '00901',
        longLat: '(-66.108731,18.464628)',
        timezone: 'America/Puerto_Rico',
        products: [
          {
            posId: null,
            name: 'Pura Cepa Product Custom Image',
            description:
              'A product with a manually uploaded image and thumbnail.',
            category: 'Candy',
            subcategory: 'Tinctures',
            isInStock: true,
            isMedicated: true,
            strainId: 8000,
            strainName: 'TestStrain',
            pricingType: 'unit',
            pricing: {
              price: 75,
              pricingGroupName: null,
              weightPrices: [],
            },
          },
        ],
      },
      {
        name: 'Pura Cepa Clinic',
        posId: 456,
        addressLine1: 'Calle San Andres',
        city: 'San Juan',
        state: { id: 52 },
        postalCode: '00906',
        longLat: '(-66.101412,18.462682)',
        timezone: 'America/Puerto_Rico',
        products: [
          {
            posId: null,
            name: 'Another Pura Cepa Product Custom Image',
            description:
              'A product with a manually uploaded image and thumbnail.',
            category: 'Toys',
            subcategory: 'Jawbreaker',
            isInStock: true,
            isMedicated: true,
            strainId: 8001,
            strainName: 'TestStrain2',
            pricingType: 'unit',
            pricing: {
              price: 80.5,
              pricingGroupName: null,
              weightPrices: [],
            },
          },
        ],
      },
    ],
  },
  {
    posId: BIOTRACK_ORGANIZATIONS[0].posId,
    pos: 'biotrack',
    name: BIOTRACK_ORGANIZATIONS[0].name,
    contactName: 'Biotrack Admin',
    contactEmail: MOCK_CONTACT_EMAILS[5],
    contactPhone: '+1-777-555-100',
    addressLine1: '11350 Palms Blvd',
    city: 'Los Angeles',
    state: { id: 5 },
    postalCode: 90066,
    locations: [],
  },
  {
    posId: FREEWAY_ORGANIZATIONS[0].posId,
    pos: 'mjfreeway',
    name: FREEWAY_ORGANIZATIONS[0].name,
    contactName: 'MJ Admin',
    contactEmail: MOCK_CONTACT_EMAILS[6],
    contactPhone: '+1-777-555-200',
    addressLine1: '11324 National Blvd',
    city: 'Los Angeles',
    state: { id: 5 },
    postalCode: 90064,
    locations: [],
  },
];
export class LocationMock {
  private organizationService: OrganizationService;
  private locationService: LocationService;
  private hoursService: HoursService;
  private userService: UserService;
  private productService: ProductService;

  constructor(private readonly module: TestingModule) {
    this.organizationService = module.get<OrganizationService>(
      OrganizationService,
    );
    this.locationService = module.get<LocationService>(LocationService);
    this.hoursService = module.get<HoursService>(HoursService);
    this.userService = module.get<UserService>(UserService);
    this.productService = module.get<ProductService>(ProductService);
  }

  async generate() {
    for (const organizationInfo of LOCATION_DATA) {
      await this.setupOrganization(organizationInfo);
    }
  }

  async setupOrganization(organizationInfo: any) {
    let organization = {
      ...new Organization(),
      ...organizationInfo,
    };
    const organizations = await this.organizationService.findWithFilter({
      search: organization.name,
    });
    if (organizations[1] === 0) {
      organization = await this.organizationService.create(organization);
    } else {
      organization = organizations[0][0];
    }

    for (const locationInfo of organizationInfo.locations) {
      locationInfo.organization = organization;
      await this.setupLocation(locationInfo);
    }
  }

  async setupLocation(locationInfo: any): Promise<Location> {
    const createdBy = await this.userService.findByEmail('gd_admin@isbx.com');
    const createdById = createdBy.id;
    let location = {
      ...new Location(),
      ...locationInfo,
    };

    const locations = await this.locationService.findWithFilter(
      locationInfo.name,
    );
    if (locations[1] === 0) {
      location = await this.locationService.create(location);
      if (locationInfo.ratings) {
        for (const rating of locationInfo.ratings) {
          await this.setupLocationRating(location, rating);
        }
      }
      if (locationInfo.products) {
        for (const productInfo of locationInfo.products) {
          await this.setupProduct(location, productInfo);
        }
      }
      // add hours to location
      if (!location.hours) {
        // 24 hour mock data
        for (const hour of MOCK_STORE_HOURS) {
          await this.setupHour(location, hour);
        }
      } else if (location.hours.length) {
        // override custom hours data by adding the hours directly
        for (const hour of location.hours) {
          await this.setupHour(location, hour);
        }
      }

      // add delivery hours to location with available delivery
      if (location.isDeliveryAvailable) {
        if (!location.deliveryHours) {
          // 24 hour mock data
          for (const deliveryHour of MOCK_DELIVERY_HOURS) {
            await this.setupDeliveryHour(location, deliveryHour);
          }
        } else if (location.deliveryHours.length) {
          // override custom hours data by adding the hours directly
          for (const deliveryHour of location.deliveryHours) {
            await this.setupDeliveryHour(location, deliveryHour);
          }
        }
      }
    }
    return this.locationService.findWithFilter(location.name)[0];
  }

  async setupLocationRating(
    location: Location,
    rating: any,
  ): Promise<LocationRating> {
    const locationRating = new LocationRating();
    locationRating.user = new User();
    const user = await this.userService.findByEmail(rating.user.email);
    locationRating.user.id = user.id;
    locationRating.location = new Location();
    locationRating.location.id = location.id;
    rating.firstName = user.firstName;
    rating.lastName = user.lastName;
    locationRating.rating = rating.rating;
    locationRating.review = rating.review;
    locationRating.createdBy = user.id;
    locationRating.modifiedBy = user.id;
    return this.locationService.createReview(locationRating);
  }

  async setupProduct(location: Location, productInfo: any): Promise<Product> {
    // cascade insert for pricing
    productInfo.location = new Location();
    productInfo.location.id = location.id;
    const product = await this.productService.create(productInfo);
    return new Promise<Product>(resolve => resolve(product));
  }

  async setupHour(
    location: Location,
    hour: LocationHour,
  ): Promise<LocationDeliveryHour> {
    hour.location = new Location();
    hour.location = location;
    return this.hoursService.createLocationHour(hour);
  }

  async setupDeliveryHour(
    location: Location,
    hour: LocationDeliveryHour,
  ): Promise<LocationDeliveryHour> {
    hour.location = new Location();
    hour.location = location;
    const existing = await this.hoursService.getLocationDeliveryHour(
      location.id,
      hour.dayOfWeek,
    );
    if (!existing) {
      return this.hoursService.createLocationDeliveryHour(hour);
    }
    return Promise.resolve(existing);
  }
}
