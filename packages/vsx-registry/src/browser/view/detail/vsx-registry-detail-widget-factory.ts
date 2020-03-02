/********************************************************************************
 * Copyright (C) 2020 TypeFox and others.
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

import { injectable, inject } from 'inversify';
import { WidgetFactory } from '@theia/core/lib/browser/widget-manager';
import { VSXRegistryDetailWidget } from './vsx-registry-detail-widget';
import { VSXRegistryService } from '../../vsx-registry-service';
import { ProgressLocationService } from '@theia/core/lib/browser/progress-location-service';
import { ProgressService } from '@theia/core/lib/common';

// TODO VSCodeExtensionEditorWidgetOptions
export interface VSXRegistryDetailWidgetOptions {
    readonly id: string
}

// TODO: inline in the frontned module
@injectable()
export class VSXRegistryDetailWidgetFactory implements WidgetFactory {

    readonly id = VSXRegistryDetailWidget.ID + '-factory';

    @inject(VSXRegistryService) protected readonly service: VSXRegistryService;
    @inject(ProgressLocationService) protected readonly progressLocationService: ProgressLocationService;
    @inject(ProgressService) protected readonly progressService: ProgressService;

    async createWidget(options: VSXRegistryDetailWidgetOptions): Promise<VSXRegistryDetailWidget> {
        const extension = await this.service.getExtension(options.id);
        const readMe = await this.service.compileDocumentation(extension);
        return new VSXRegistryDetailWidget(extension, readMe, this.service, this.progressService, this.progressLocationService);
    }

}
