import { mergeApplicationConfig, ApplicationConfig } from '@angular/core';
import { appConfig } from './app/app.config';
import { provideServerRendering, withRoutes } from '@angular/ssr';
import { serverRoutes } from './app/app.routes.server';

const serverConfig: ApplicationConfig = mergeApplicationConfig(appConfig, {
  providers: [provideServerRendering(withRoutes(serverRoutes))],
});

export default serverConfig;
