/********************************************************************************
 * Copyright (C) 2019 TypeFox and others.
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License v. 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * This Source Code may also be made available under the following Secondary
 * Licenses when the conditions for such availability set forth in the Eclipse
 * Public License v. 2.0 are satisfied: GNU General Public License, version 2
 * with the GNU Classpath Exception which is available at
 * https://www.gnu.org/software/classpath/license.html.
 *
 * SPDX-License-Identifier: EPL-2.0 OR GPL-2.0 WITH Classpath-exception-2.0
 ********************************************************************************/

import '../../src/browser/style/index.css';

import { ContainerModule } from 'inversify';
import { WidgetFactory, bindViewContribution, FrontendApplicationContribution, ViewContainerIdentifier, OpenHandler } from '@theia/core/lib/browser';
import { VSXExtensionsViewContainer } from './vsx-extensions-view-container';
import { VSXExtensionsContribution } from './vsx-registry-contribution';
import { VSXRegistrySearchbarWidget } from './view/list/vsx-registry-searchbar-widget';
import { VSXRegistryAPI } from './vsx-registry-api';
import { VSXRegistryService } from './vsx-registry-service';
import { VSXRegistryOpenHandler } from './view/detail/vsx-registry-open-handler';
import { VSXRegistryDetailWidgetFactory } from './view/detail/vsx-registry-detail-widget-factory';
import { bindVSXRegistryPreferences } from './vsx-registry-preferences';
import { ColorContribution } from '@theia/core/lib/browser/color-application-contribution';
import { VSXExtensionsWidget } from './vsx-extensions-widget';
import { TabBarToolbarContribution } from '@theia/core/lib/browser/shell/tab-bar-toolbar';

export default new ContainerModule(bind => {
    bindVSXRegistryPreferences(bind);
    bind(VSXRegistryAPI).toSelf().inSingletonScope();
    bind(VSXRegistryService).toSelf().inSingletonScope();

    bind(VSXRegistryDetailWidgetFactory).toSelf().inSingletonScope();
    bind(WidgetFactory).toService(VSXRegistryDetailWidgetFactory);
    bind(VSXRegistryOpenHandler).toSelf().inSingletonScope();
    bind(OpenHandler).toService(VSXRegistryOpenHandler);

    bind(WidgetFactory).toDynamicValue(ctx => ({
        id: VSXExtensionsViewContainer.ID,
        createWidget: async () => {
            const container = ctx.container.createChild();
            container.bind(VSXExtensionsWidget).toDynamicValue(() => VSXExtensionsWidget.createWidget(ctx.container, {
                id: 'search'
            })).whenTargetNamed('search');
            container.bind(VSXExtensionsWidget).toDynamicValue(() => VSXExtensionsWidget.createWidget(ctx.container, {
                id: 'installed'
            })).whenTargetNamed('installed');
            container.bind(ViewContainerIdentifier).toConstantValue({ id: VSXExtensionsViewContainer.ID });
            container.bind(VSXExtensionsViewContainer).toSelf().inSingletonScope();
            return container.get(VSXExtensionsViewContainer);
        }
    })).inSingletonScope();

    bindViewContribution(bind, VSXExtensionsContribution);
    bind(FrontendApplicationContribution).toService(VSXExtensionsContribution);
    bind(ColorContribution).toService(VSXExtensionsContribution);
    bind(TabBarToolbarContribution).toService(VSXExtensionsContribution);
    bind(VSXRegistrySearchbarWidget).toSelf().inSingletonScope();
});
