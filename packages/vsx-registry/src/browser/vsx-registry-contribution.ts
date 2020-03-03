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

import { injectable, inject } from 'inversify';
import { Command, CommandRegistry } from '@theia/core/lib/common/command';
import { AbstractViewContribution } from '@theia/core/lib/browser/shell/view-contribution';
import { VSXExtensionsViewContainer } from './vsx-extensions-view-container';
import { Widget } from '@theia/core/lib/browser/widgets/widget';
import { VSXRegistryService } from './vsx-registry-service';
import { ColorContribution } from '@theia/core/lib/browser/color-application-contribution';
import { ColorRegistry, Color } from '@theia/core/lib/browser/color-registry';
import { TabBarToolbarContribution, TabBarToolbarRegistry } from '@theia/core/lib/browser/shell/tab-bar-toolbar';

export namespace VSCodeExtensionsCommands {
    export const CLEAR_ALL: Command = {
        id: 'vsx-registry.clear-all',
        category: 'Extensions',
        label: 'Clear Search Results',
        iconClass: 'clear-all'
    };
}

@injectable()
export class VSXExtensionsContribution extends AbstractViewContribution<VSXExtensionsViewContainer> implements ColorContribution, TabBarToolbarContribution {

    @inject(VSXRegistryService) protected readonly service: VSXRegistryService;

    constructor() {
        super({
            widgetId: VSXExtensionsViewContainer.ID,
            widgetName: VSXExtensionsViewContainer.LABEL,
            defaultWidgetOptions: {
                area: 'left',
                rank: 500
            },
            toggleCommandId: 'vsxRegistryView:toggle',
            toggleKeybinding: 'ctrlcmd+shift+x'
        });
    }

    registerCommands(commands: CommandRegistry): void {
        super.registerCommands(commands);
        commands.registerCommand(VSCodeExtensionsCommands.CLEAR_ALL, {
            execute: w => this.withWidget(w, widget => widget.searchBar.clear()),
            isEnabled: w => this.withWidget(w, widget => !!widget.searchBar.getSearchTerm()),
            isVisible: w => this.withWidget(w, () => true)
        });
    }

    registerToolbarItems(registry: TabBarToolbarRegistry): void {
        registry.registerItem({
            id: VSCodeExtensionsCommands.CLEAR_ALL.id,
            command: VSCodeExtensionsCommands.CLEAR_ALL.id,
            tooltip: VSCodeExtensionsCommands.CLEAR_ALL.label,
            priority: 1,
            onDidChange: this.service.onDidSearch
        });
    }

    registerColors(colors: ColorRegistry): void {
        // TODO add a link to VS Code colors reference for extensions
        colors.register(
            {
                id: 'extensionButton.prominentBackground', defaults: {
                    dark: '#327e36',
                    light: '#327e36'
                }, description: 'Button background color for actions extension that stand out (e.g. install button).'
            },
            {
                id: 'extensionButton.prominentForeground', defaults: {
                    dark: Color.white,
                    light: Color.white
                }, description: 'Button foreground color for actions extension that stand out (e.g. install button).'
            },
            {
                id: 'extensionButton.prominentHoverBackground', defaults: {
                    dark: '#28632b',
                    light: '#28632b'
                }, description: 'Button background hover color for actions extension that stand out (e.g. install button).'
            }
        );
    }

    protected withWidget<T>(widget: Widget | undefined = this.tryGetWidget(), fn: (widget: VSXExtensionsViewContainer) => T): T | false {
        if (widget instanceof VSXExtensionsViewContainer && widget.id === VSXExtensionsViewContainer.ID) {
            return fn(widget);
        }
        return false;
    }
}
