import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { MeetingService } from './meeting.service';
import { Meeting, NewMeeting } from '../models/models';

const BASE = 'http://localhost:3000/meetings';

const mockMeeting: Meeting = {
  id: 'm1',
  title: 'Test Meeting',
  organizer: 'Ali',
  roomId: 'room-atlas',
  date: '2026-08-03',
  startTime: '09:00',
  endTime: '10:00',
  attendeesCount: 3,
};

describe('MeetingService', () => {
  let service: MeetingService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(MeetingService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('getByDate sends correct params', () => {
    service.getByDate('2026-08-03').subscribe();
    const req = httpMock.expectOne((r) => r.url === BASE);
    expect(req.request.params.get('date')).toBe('2026-08-03');
    expect(req.request.params.get('_sort')).toBe('startTime');
    req.flush([mockMeeting]);
  });

  it('getByDate with roomId sends roomId param', () => {
    service.getByDate('2026-08-03', 'room-atlas').subscribe();
    const req = httpMock.expectOne((r) => r.url === BASE);
    expect(req.request.params.get('roomId')).toBe('room-atlas');
    req.flush([mockMeeting]);
  });

  it('getById fetches single meeting', () => {
    service.getById('m1').subscribe((m) => expect(m.id).toBe('m1'));
    const req = httpMock.expectOne(`${BASE}/m1`);
    expect(req.request.method).toBe('GET');
    req.flush(mockMeeting);
  });

  it('create sends POST with correct body', () => {
    const payload: NewMeeting = { ...mockMeeting };
    delete (payload as Partial<Meeting>).id;
    service.create(payload as NewMeeting).subscribe();
    const req = httpMock.expectOne(BASE);
    expect(req.request.method).toBe('POST');
    req.flush(mockMeeting);
  });

  it('update sends PUT with id in body', () => {
    const payload: NewMeeting = { ...mockMeeting };
    delete (payload as Partial<Meeting>).id;
    service.update('m1', payload as NewMeeting).subscribe();
    const req = httpMock.expectOne(`${BASE}/m1`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body.id).toBe('m1');
    req.flush(mockMeeting);
  });

  it('delete sends DELETE request', () => {
    service.delete('m1').subscribe();
    const req = httpMock.expectOne(`${BASE}/m1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });
});
