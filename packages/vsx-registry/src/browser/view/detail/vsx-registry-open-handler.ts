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

import { injectable } from 'inversify';
import URI from '@theia/core/lib/common/uri';
import { WidgetOpenHandler, WidgetOpenerOptions } from '@theia/core/lib/browser';
import { VSXRegistryDetailWidget } from './vsx-registry-detail-widget';
import { VSXRegistryDetailWidgetOptions } from './vsx-registry-detail-widget-factory';

export namespace VSXRegistryUri {
    export function toUri(id: string): URI {
        return new URI(`vscode:extension/${id}`);
    }
    export function toId(uri: URI): string {
        if (uri.scheme === 'vscode' && uri.path.dir.toString() === 'extension') {
            return uri.path.base;
        }
        throw new Error('The given uri is not an vscode extension URI, uri: ' + uri);
    }
}

export type VSXRegistryDetailOpenerOptions = WidgetOpenerOptions & VSXRegistryDetailWidgetOptions;

@injectable()
export class VSXRegistryOpenHandler extends WidgetOpenHandler<VSXRegistryDetailWidget> {

    readonly id = VSXRegistryDetailWidget.ID + '-manager';

    canHandle(uri: URI): number {
        try {
            VSXRegistryUri.toId(uri);
            return 500;
        } catch {
            return 0;
        }
    }

    protected createWidgetOptions(uri: URI, options: WidgetOpenerOptions): VSXRegistryDetailWidgetOptions {
        return {
            id: VSXRegistryUri.toId(uri)
        };
    }

}
