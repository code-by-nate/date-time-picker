/**
 * dialog.component
 */

import { Component, OnInit, ElementRef, OnDestroy } from '@angular/core';
import * as moment from 'moment/moment';
import { Moment } from 'moment/moment';
import { PickerService } from './picker.service';
import { Subscription } from 'rxjs/Rx';
import { TRANSLATION_PROVIDERS } from './translations';
import { TranslateService } from './translate.service';

@Component({
    selector: 'date-time-dialog',
    templateUrl: './dialog.component.html',
    styleUrls: ['./dialog.component.scss'],
    providers: [PickerService, TRANSLATION_PROVIDERS, TranslateService],
})
export class DialogComponent implements OnInit, OnDestroy {

    private selectedMoment: Moment;
    private directiveInstance: any;
    private directiveElementRef: ElementRef;
    private top: number;
    private left: number;
    private width: string;
    private height: string = 'auto';
    private position: string;

    public show: boolean;
    public initialValue: string;
    public now: Moment;
    public positionOffset: string;
    public mode: 'popup' | 'dropdown' | 'inline';
    public returnObject: string;
    public dialogType: DialogType;
    public pickerType: 'both' | 'date' | 'time';

    private subId: Subscription;

    constructor( private el: ElementRef,
                 private translate: TranslateService,
                 private service: PickerService ) {
    }

    public ngOnInit() {
        this.positionOffset = this.service.dtPositionOffset;
        this.mode = this.service.dtMode;
        this.returnObject = this.service.dtReturnObject;
        this.pickerType = this.service.dtPickerType;
        this.translate.use(this.service.dtLocale);
        moment.locale(this.service.dtLocale);

        // set now value
        this.now = moment();
        this.subId = this.service.selectedMomentChange.subscribe(
            ( selectedMoment: Moment ) => {
                this.selectedMoment = selectedMoment;
            }
        );
        this.openDialog(this.initialValue);
    }

    public ngOnDestroy(): void {
        if (this.subId) {
            this.subId.unsubscribe();
        }
    }

    public openDialog( moment: any ): void {
        this.show = true;

        if (this.mode === 'dropdown') {
            this.setDialogPosition();
        } else if (this.mode === 'inline') {
            this.setInlineDialogPosition();
        }
        this.dialogType = this.service.dtDialogType;
        this.setSelectedMoment(moment);
        return;
    }

    public setSelectedMoment( moment: any ): void {
        this.service.setMoment(moment);
    }

    public cancelDialog(): void {
        this.show = false;
        return;
    }

    public setInitialMoment( value: any ) {
        this.initialValue = value;
    }

    public setDialog( instance: any, elementRef: ElementRef, initialValue: any, dtLocale: string, dtViewFormat: string, dtReturnObject: string,
                      dtPositionOffset: string, dtMode: 'popup' | 'dropdown' | 'inline',
                      dtHourTime: '12' | '24', dtTheme: string,
                      dtPickerType: 'both' | 'date' | 'time', dtShowSeconds: boolean, dtOnlyCurrent: boolean ): void {
        this.directiveInstance = instance;
        this.directiveElementRef = elementRef;
        this.initialValue = initialValue;

        this.service.setPickerOptions(dtLocale, dtViewFormat, dtReturnObject,
            dtPositionOffset, dtMode, dtHourTime, dtTheme, dtPickerType, dtShowSeconds, dtOnlyCurrent);
    }

    public confirm( close: boolean ): void {
        this.returnSelectedMoment();
        if (close === true) {
            this.cancelDialog();
        } else {
            this.dialogType = this.service.dtDialogType;
        }
    }

    public toggleDialogType( type: DialogType ): void {
        if (this.dialogType === type) {
            this.dialogType = this.service.dtDialogType;
        } else {
            this.dialogType = type;
        }
    }

    public setDate( moment: Moment ): void {
        this.service.setDate(moment);
        this.confirm(false);
    }

    public setTime( time: { hour: number, min: number, sec: number, meridian: string } ): void {
        this.service.setTime(time.hour, time.min, time.sec, time.meridian);
        if (this.service.dtPickerType === 'time') {
            this.confirm(true);
        } else {
            this.confirm(false);
        }
    }

    public getDialogStyle(): any {
        if (this.mode === 'popup') {
            return {}
        } else {
            return {
                'width': this.width,
                'height': this.height,
                'top.px': this.top,
                'left.px': this.left,
                'position': this.position
            };
        }
    }

    private setDialogPosition() {
        if (window.innerWidth < 768) {
            this.position = 'fixed';
            this.top = 0;
            this.left = 0;
            this.width = '100%';
            this.height = '100%';
        } else {
            let node = this.directiveElementRef.nativeElement;
            let position = 'static';
            let transform;
            let parentNode: any = null;
            let boxDirective;

            while (node !== null && node.tagName !== 'HTML') {
                position = window.getComputedStyle(node).getPropertyValue("position");
                transform = window.getComputedStyle(node).getPropertyValue("-webkit-transform");
                if (position !== 'static' && parentNode === null) {
                    parentNode = node;
                }
                if (position === 'fixed') {
                    break;
                }
                node = node.parentNode;
            }

            if (position !== 'fixed' || transform) {
                boxDirective = this.createBox(this.directiveElementRef.nativeElement, true);
                if (parentNode === null) {
                    parentNode = node
                }
                let boxParent = this.createBox(parentNode, true);
                this.top = boxDirective.top - boxParent.top;
                this.left = boxDirective.left - boxParent.left;
            } else {
                boxDirective = this.createBox(this.directiveElementRef.nativeElement, false);
                this.top = boxDirective.top;
                this.left = boxDirective.left;
                this.position = 'fixed';
            }

            this.top += boxDirective.height + 3;
            this.left += parseInt(this.positionOffset) / 100 * boxDirective.width;
            this.width = this.directiveElementRef.nativeElement.offsetWidth + 'px';
        }
    }

    private setInlineDialogPosition() {
        this.position = 'relative';
        this.width = this.directiveElementRef.nativeElement.offsetWidth + 'px';
    }

    private createBox( element: any, offset: boolean ) {
        return {
            top: element.getBoundingClientRect().top + (offset ? window.pageYOffset : 0),
            left: element.getBoundingClientRect().left + (offset ? window.pageXOffset : 0),
            width: element.offsetWidth,
            height: element.offsetHeight
        };
    }

    private returnSelectedMoment(): void {
        let m = this.selectedMoment || this.now;
        let selectedM = this.service.parseToReturnObjectType(m);
        this.directiveInstance.momentChanged(selectedM);
    }
}

export enum DialogType {
    Time,
    Date,
    Month,
    Year,
}
