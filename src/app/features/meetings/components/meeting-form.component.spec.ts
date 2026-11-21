import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ComponentFixture } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { signal } from '@angular/core';

import { MeetingFormComponent } from './meeting-form.component';
import { Room } from '../../../core/models/models';

const mockRooms: Room[] = [
  { id: 'room-atlas', name: 'Atlas', capacity: 4 },
  { id: 'room-orion', name: 'Orion', capacity: 8 },
];

describe('MeetingFormComponent', () => {
  let fixture: ComponentFixture<MeetingFormComponent>;
  let component: MeetingFormComponent;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MeetingFormComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(MeetingFormComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);

    fixture.componentRef.setInput('rooms', mockRooms);
    fixture.detectChanges();
  });

  afterEach(() => httpMock.verify());

  it('should create', () => expect(component).toBeTruthy());

  it('form is invalid when empty', () => {
    expect(component.form.invalid).toBeTrue();
  });

  it('shows error when title is blank spaces', fakeAsync(() => {
    component.form.controls.title.setValue('   ');
    component.form.controls.title.markAsTouched();
    fixture.detectChanges();
    expect(component.form.controls.title.hasError('blank')).toBeTrue();
  }));

  it('capacityError fires when attendees exceed room capacity', () => {
    component.form.controls.roomId.setValue('room-atlas');
    component.form.controls.attendeesCount.setValue(10);
    fixture.detectChanges();
    expect(component.capacityError()).toContain('ظرفیت');
  });

  it('capacityError is null when within capacity', () => {
    component.form.controls.roomId.setValue('room-atlas');
    component.form.controls.attendeesCount.setValue(3);
    fixture.detectChanges();
    expect(component.capacityError()).toBeNull();
  });

  it('endTime before startTime sets endBeforeStart error', fakeAsync(async () => {
    component.form.patchValue({
      title: 'Test',
      organizer: 'Ali',
      date: '2026-08-03',
      roomId: 'room-atlas',
      attendeesCount: 2,
      startTime: '10:00',
      endTime: '09:00',
    });
    await component.onSubmit();
    expect(component.form.controls.endTime.hasError('endBeforeStart')).toBeTrue();
  }));
});
