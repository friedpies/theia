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
 *******************************************************************************‚*/

import { injectable, inject, postConstruct, named } from 'inversify';
import { ViewContainer, PanelLayout, SplitPanel, ViewContainerLayout, ViewContainerPart } from '@theia/core/lib/browser';
import { VSXRegistrySearchbarWidget } from './view/list/vsx-registry-searchbar-widget';
import { VSXRegistryService } from './vsx-registry-service';
import { ProgressBar } from '@theia/core/lib/browser/progress-bar';
import { VSXExtensionsWidget } from './vsx-extensions-widget';

@injectable()
export class VSXExtensionsViewContainer extends ViewContainer {

    static ID = 'vsx-extensions-view-container';
    static LABEL = 'Extensions';

    protected progressLocation: string;

    @inject(VSXRegistryService)
    protected readonly service: VSXRegistryService;

    @inject(VSXRegistrySearchbarWidget)
    readonly searchBar: VSXRegistrySearchbarWidget;

    @inject(VSXExtensionsWidget) @named('installed')
    readonly installed: VSXExtensionsWidget;

    @inject(VSXExtensionsWidget) @named('search')
    readonly searchResult: VSXExtensionsWidget;

    @postConstruct()
    protected init(): void {
        super.init();

        this.id = VSXExtensionsViewContainer.ID;
        this.setTitleOptions({
            label: VSXExtensionsViewContainer.LABEL,
            iconClass: 'theia-vsx-registry-tab-icon',
            closeable: true
        });

        // TODO: why 2 classes? shoud be one theia-vsx-extensions-view-container
        this.addClass('theia-vsx-registry');
        this.addClass('extension-list');

        this.addWidget(this.installed, { canHide: true });
        const installed = this.getPartFor(this.installed);
        this.addWidget(this.searchResult, { canHide: true });
        const searchResult = this.getPartFor(this.searchResult);
        if (searchResult) {
            searchResult.setHidden(true);
        }
        this.service.onDidSearch(() => {
            // TODO it should work for custom parts as well
            if (searchResult && installed) {
                const query = this.searchBar.getSearchTerm();
                if (!!query) {
                    searchResult.setHidden(false);
                    installed.setHidden(true);
                } else {
                    searchResult.setHidden(true);
                    installed.setHidden(false);
                }
            }
        });

        // TODO it should be aligned with VS Code constants
        this.progressLocation = 'vsx-registry-list';
        const onProgress = this.progressLocationService.onProgress(this.progressLocation);
        this.toDispose.push(new ProgressBar({ container: this.node, insertMode: 'prepend' }, onProgress));
    }

    protected initLayout(): void {
        const layout = new PanelLayout();
        this.layout = layout;
        this.panel = new SplitPanel({
            layout: new ViewContainerLayout({
                renderer: SplitPanel.defaultRenderer,
                orientation: this.orientation,
                spacing: 2,
                headerSize: ViewContainerPart.HEADER_HEIGHT,
                animationDuration: 200
            }, this.splitPositionHandler)
        });
        this.panel.node.tabIndex = -1;
        layout.addWidget(this.searchBar);
        this.searchBar.update();
        layout.addWidget(this.panel);
    }
}
