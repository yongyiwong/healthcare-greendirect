import * as csvParse from 'csv-parse/lib/sync';
import * as fs from 'fs';
import * as serializeError from 'serialize-error';

import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@sierralabs/nest-utils';

import { AppModule } from './app.module';
import {
  AutomatedEmailType,
  CampaignMonitorService,
} from './campaign-monitor/campaign-monitor.service';
import { MessageService } from './message/message.service';
import { NotificationService } from './notification/notification.service';
import { ProductService } from './product/product.service';
import { BiotrackCSVInventoryService } from './synchronize/biotrack/biotrack-inventory-csv.service';
import { BiotrackInventoryService } from './synchronize/biotrack/biotrack-inventory.service';
import { BiotrackOrderService } from './synchronize/biotrack/biotrack-order.service';
import { BiotrackUserService } from './synchronize/biotrack/biotrack-user.service';
import { MjfreewayInventoryService } from './synchronize/mjfreeway/mjfreeway-inventory.service';
import { MjfreewayOrderService } from './synchronize/mjfreeway/mjfreeway-order.service';
import { MjfreewayUserService } from './synchronize/mjfreeway/mjfreeway-user.service';
import { GreenDirectLogger } from './greendirect-logger';
import {Logger, LoggerService} from '@nestjs/common';

export enum TaskType {
  SynchronizeInventory = 'SYNCHRONIZE_INVENTORY',
  SynchronizeOrders = 'SYNCHRONIZE_ORDERS',
  // CloseOpenOrders = "CLOSE_OPEN_ORDERS",
  SynchronizeFreewayUsers = 'SYNCHRONIZE_FREEWAY_USERS',
  SubscribeMarketing = 'SUBSCRIBE_MARKETING',
  SendWeeklyEmails = 'SEND_WEEKLY_EMAILS',
  SendDailyEmails = 'SEND_DAILY_EMAILS',
  ImportBwellUsers = 'IMPORT_BWELL_USERS',
  ImportBiotrackCSVInventory = 'IMPORT_BIO_TRACK_CSV_INVENTORY',
  SynchronizeBiotrackInventory = 'SYNCHRONIZE_BIO_TRACK_INVENTORY',
  SynchronizeBiotrackUsers = 'SYNCHRONIZE_BIO_TRACK_USERS',
  ExportProductPhotos = 'EXPORT_PRODUCT_PHOTOS',
  ImportProductPhotos = 'IMPORT_PRODUCT_PHOTOS',
}

export class TaskRunner {
  module: TestingModule; // using NestJS TestingModule to run tasks
  logger: LoggerService = new GreenDirectLogger('TaskRunner');

  constructor(protected readonly task: TaskType) {}

  async run() {
    this.module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    const nestFactoryOptions = {
      logger: this.logger,
    };
    const app = this.module.createNestApplication(undefined, nestFactoryOptions);
    await app.init();

    switch (this.task) {
      case TaskType.SynchronizeInventory:
        await this.synchronizeInventory();
        break;
      case TaskType.SynchronizeOrders:
        await this.synchronizeSubmittedOrders();
        break;
      // case TaskType.CloseOpenOrders:
      //   await this.closeOpenOrders();
      //   break;
      case TaskType.SynchronizeFreewayUsers:
        await this.synchronizeFreewayUsers();
        break;
      case TaskType.SubscribeMarketing:
        await this.subscribeMarketing();
        break;
      case TaskType.SendWeeklyEmails:
        await this.sendAutomatedEmails(AutomatedEmailType.WeeklyEmails);
        break;
      case TaskType.SendDailyEmails:
        await this.sendAutomatedEmails(AutomatedEmailType.DailyEmails);
        break;
      case TaskType.ImportBwellUsers:
        await this.importBwellUsers();
        break;
      case TaskType.ImportBiotrackCSVInventory:
        await this.importBiotrackCSVInventory();
        break;
      case TaskType.SynchronizeBiotrackInventory:
        await this.synchronizeBiotrackInventory();
        break;
      case TaskType.SynchronizeBiotrackUsers:
        await this.synchronizeBiotrackUsers();
        break;
      case TaskType.ExportProductPhotos:
        await this.exportProductPhotos();
        break;
      case TaskType.ImportProductPhotos:
        await this.importProductPhotos();
        break;
    }

    await app.close();
  }

  error(message: string, error: Error) {
    this.logger.error(message, JSON.stringify(serializeError(error)));
    this.sendErrorNotificationEmail(message, error);
  }

  async sendErrorNotificationEmail(subject: string, error: Error) {
    const notificationService = this.module.get<NotificationService>(
      NotificationService,
    );
    const configService = new ConfigService();
    await notificationService.sendEmail({
      from: configService.get('email.from'),
      to: configService.get('email.techSupport'),
      subject,
      message:
        'An error occurred:\n' + JSON.stringify(serializeError(error), null, 2),
    });
  }

  /**
   * Start the inventory synchronization process with Point-of-Sale (POS) system (i.e. MJ Freeway)
   */
  async synchronizeInventory() {
    this.logger.log('Starting MJFreeway & Biotrack inventory synchronization.');
    const mjfreewayInventoryService = this.module.get<
      MjfreewayInventoryService
    >(MjfreewayInventoryService);
    const biotrackInventoryService = this.module.get<BiotrackInventoryService>(
      BiotrackInventoryService,
    );
    try {
      await mjfreewayInventoryService.synchronizeInventory(1); // default to admin/system user
      await biotrackInventoryService.synchronizeInventory(1); // default to admin/system user
    } catch (error) {
      this.error('GreenDirect: Error synchronizing Inventory', error);
    }
    this.logger.log('Completed inventory synchronization.');
  }

  /**
   * Start the order synchronization process with Point-of-Sale (POS) system (i.e. MJ Freeway)
   */
  async synchronizeSubmittedOrders() {
    const mjfreewayOrderService = this.module.get<MjfreewayOrderService>(
      MjfreewayOrderService,
    );
    const biotrackOrderService = this.module.get<BiotrackOrderService>(
      BiotrackOrderService,
    );
    this.logger.log('Starting order synchronization.');
    try {
      await mjfreewayOrderService.syncSubmittedOrders(1); // default to admin/system user
      await biotrackOrderService.syncSubmittedOrders(1);
    } catch (error) {
      this.error('GreenDirect: Error synchronizing submitted orders', error);
    }
    this.logger.log('Completed order synchronization.');
  }

  /**
   * Start the process to close open orders
   */
  // async closeOpenOrders() {
  //   const mjfreewayOrderService = this.module.get<MjfreewayOrderService>(
  //     MjfreewayOrderService
  //   );
  //   this.log("Starting CLOSE_OPEN_ORDERS task");
  //   try {
  //     await mjfreewayOrderService.closeOpenOrders(); // default to admin/system user
  //     this.log("CLOSE_OPEN_ORDER_TASK_STARTING");
  //   } catch (error) {
  //     this.error("GreenDirect: Error in CLOSE_OPEN_ORDERS task", error);
  //   }
  //   this.log("CLOSE_OPEN_ORDER_TASK_COMPLETED");
  // }

  /**
   * Start the user synchronization process with Point-of-Sale (POS) system (i.e. MJ Freeway)
   */
  async synchronizeFreewayUsers() {
    const mjfreewayUserService = this.module.get<MjfreewayUserService>(
      MjfreewayUserService,
    );
    this.logger.log('Starting MJ Freeway users synchronization.');
    try {
      await mjfreewayUserService.synchronizeUsers();
      await mjfreewayUserService.onBoardNewUsersToGD();
    } catch (error) {
      this.error('GreenDirect: Error synchronizing MJ Freeway Users', error);
    }
    this.logger.log('Completed MJ Freeway users synchronization.');
  }

  /**
   * Subscribe all users for marketing emails (only used for initial load)
   */
  async subscribeMarketing() {
    const messageService = this.module.get<MessageService>(MessageService);
    this.logger.log('Starting bulk subscribe marketing.');
    try {
      await messageService.bulkSubscribeMarketing();
    } catch (error) {
      this.error('GreenDirect: Error subscribe marketing', error);
    }
    this.logger.log('Completed bulk subscribe marketing.');
  }

  /**
   * Send automated emails for Bwell via Campaign Monitor
   * @param automatedEmailType
   */
  async sendAutomatedEmails(automatedEmailType: AutomatedEmailType) {
    const campaignMonitorService = this.module.get<CampaignMonitorService>(
      CampaignMonitorService,
    );
    this.logger.log('Starting automated emails.');
    try {
      await campaignMonitorService.sendAutomatedEmails(automatedEmailType);
    } catch (error) {
      this.error(
        `GreenDirect: Error sending automated ${automatedEmailType} emails`,
        error,
      );
    }
    this.logger.log('Completed automated emails.');
  }

  async importBwellUsers() {
    const mjfreewayUserService = this.module.get<MjfreewayUserService>(
      MjfreewayUserService,
    );
    const fileData = fs.readFileSync('bwell_consumers.csv', 'utf8');
    const records = csvParse(fileData, {
      columns: true,
      skip_empty_lines: true,
    });
    await mjfreewayUserService.importBwellUsers(records);
  }

  async importBiotrackCSVInventory() {
    const biotrackCSVInventoryService = this.module.get<
      BiotrackCSVInventoryService
    >(BiotrackCSVInventoryService);
    const fileData = fs.readFileSync('biotrack_inventory.csv', 'utf8');
    const records = csvParse(fileData, {
      columns: true,
      skip_empty_lines: true,
    });
    await biotrackCSVInventoryService.synchronizeBiotrackInventory(records);
  }

  async synchronizeBiotrackInventory() {
    this.logger.log('Starting Biotrack inventory synchronization.');
    const biotrackInventoryService = this.module.get<BiotrackInventoryService>(
      BiotrackInventoryService,
    );
    try {
      await biotrackInventoryService.synchronizeInventory(1); // default to admin/system user
    } catch (error) {
      this.error('GreenDirect: Error synchronizing Inventory', error);
    }
    this.logger.log('Completed inventory synchronization.');
  }

  async synchronizeBiotrackUsers() {
    const biotrackUserService = this.module.get<BiotrackUserService>(
      BiotrackUserService,
    );
    this.logger.log('Starting Biotrack users synchronization.');
    try {
      await biotrackUserService.synchronizeUsers();
      await biotrackUserService.onBoardNewUsersToGD();
    } catch (error) {
      this.error('GreenDirect: Error synchronizing Biotrack Users', error);
    }
    this.logger.log('Completed Biotrack users synchronization.');
  }

  async exportProductPhotos() {
    if (process.argv.length < 3) {
      this.logger.log('ERROR: Please provide a location Id as a command argument.');
      return;
    }
    const locationId = +process.argv[2];
    const productService = this.module.get<ProductService>(ProductService);
    this.logger.log('Starting Product Photos Export');
    try {
      await productService.exportProductPhotos(
        locationId,
        `./export/${locationId}`,
      );
    } catch (error) {
      this.logger.error('Error exporting product photos', error);
      return;
    }
    this.logger.log('Completed Product Photos Export');
  }

  async importProductPhotos() {
    if (process.argv.length < 3) {
      throw Error(
        'Please provide the destination location ID as a command argument.',
      );
    }
    if (process.argv.length < 4) {
      throw Error('Please provide an import path as a command argument.');
    }
    const locationId = +process.argv[2];
    const importCsvPath = process.argv[3];
    const productService = this.module.get<ProductService>(ProductService);
    this.logger.log('Starting Product Photos Import');
    try {
      await productService.importProductPhotos(locationId, importCsvPath);
    } catch (error) {
      this.logger.error('Error importing product photos', error);
      return;
    }
    this.logger.log('Completed Product Photos Import');
  }
}
