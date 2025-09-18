// health - route
import './v1/app-health.route';
import './v1/app-health-public.route';

// tickets - route
import '../modules/ticket/routes/ticket-create.route';
import '../modules/ticket/routes/ticket-delete-all.route';
import '../modules/ticket/routes/ticket-update.route';
import '../modules/ticket/routes/ticket-get.route';
import '../modules/ticket/routes/ticket-list.route';
import '../modules/ticket/routes/ticket-status.route';
import '../modules/ticket/routes/ticket-delete.route';
import '../modules/ticket/routes/ticket-cancel.route';
import '../modules/ticket/routes/ticket-notes-add.route';
import '../modules/ticket/routes/ticket-notes-get.route';
import '../modules/ticket/routes/ticket-migrate-notes.route';

// persons - route
import '../modules/person/routes/person-maintenance.route';
import '../modules/person/routes/person-create.route';
import '../modules/person/routes/person-update.route';
import '../modules/person/routes/person-list.route';
import '../modules/person/routes/person-get.route';
import '../modules/person/routes/person-delete.route';

// categories route
import '../modules/category/routes/category-create.route';
import '../modules/category/routes/category-update.route';
import '../modules/category/routes/category-list.route';
import '../modules/category/routes/category-get.route';
import '../modules/category/routes/category-delete.route';
import '../modules/category/routes/subcategory-add.route';
import '../modules/category/routes/subcategory-update.route';
import '../modules/category/routes/subcategory-delete.route';
import '../modules/category/routes/category-seed.route';

// locations - route
import '../modules/location/routes/location-list.route';

// attachments - route
import '../modules/attachment/routes/attachment-upload.route';
import '../modules/attachment/routes/attachment-list.route';
import '../modules/attachment/routes/attachment-get.route';
import '../modules/attachment/routes/attachment-download.route';
import '../modules/attachment/routes/attachment-migrate.route';
import '../modules/attachment/routes/attachment-migrate-all.route';
import '../modules/attachment/routes/attachment-delete.route';
