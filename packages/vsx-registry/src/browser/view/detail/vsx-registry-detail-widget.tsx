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

import * as React from 'react';
import { ReactWidget } from '@theia/core/lib/browser';
import { VSXRegistryDetailHeader } from './vsx-registry-detail-header-component';
import { VSXRegistryService } from '../../vsx-registry-service';
import { ProgressService } from '@theia/core/lib/common';
import { ProgressLocationService } from '@theia/core/lib/browser/progress-location-service';
import { VSCodeExtensionFull } from '../../vsx-registry-types';

// TODO @injectable()
// TODO VSCodeExtensionEditorWidget
export class VSXRegistryDetailWidget extends ReactWidget {

    static ID = 'vscode-extension-editor';

    constructor(
        protected readonly extension: VSCodeExtensionFull,
        protected readonly readMe: string,
        protected readonly service: VSXRegistryService,
        protected readonly progressService: ProgressService,
        protected readonly progressLocationService: ProgressLocationService
    ) {
        super();
        this.addClass('vscode-extension-detail');
        this.addClass('theia-vsx-registry');
        this.addClass('extension-detail');
        this.title.closable = true;
        // TODO: fix label and caption
        this.title.label = extension.name;
        // TODO: use extension icon when possible otherwise align with VS COde
        this.title.iconClass = 'fa fa-puzzle-piece';
        this.id = VSXRegistryDetailWidget.ID + ':' + extension.publisher.toLowerCase() + '.' + extension.name.toLowerCase();

        this.update();
        this.toDispose.push(service.onDidChangeInstalled(() => this.update()));
    }

    protected render(): React.ReactNode {
        return <React.Fragment>
            <VSXRegistryDetailHeader
                toDispose={this.toDispose}
                id={this.id}
                progressLocationService={this.progressLocationService}
                progressService={this.progressService}
                extension={this.extension}
                service={this.service} />
            <div className='extension-doc-container flexcontainer'>
                <div className='extension-documentation'>
                    <span dangerouslySetInnerHTML={{ __html: this.readMe }} />
                </div>
            </div>
        </React.Fragment>;
    }

}
