import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import {
  getDoctorForCurrentUser,
  getAppointmentsForDoctor,
  updateDoctorProfile,
} from '@/api/doctors';
import { Appointment } from '@/api/entities';
import { sendAppointmentStatusEmail } from '@/api/appointmentEmail';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import {
  Calendar,
  CheckCircle,
  XCircle,
  Stethoscope,
  Mail,
  AlertCircle,
} from 'lucide-react';

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

export default function DoctorDashboard() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [profileForm, setProfileForm] = useState(null);

  const {
    data: doctor,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['my_doctor_profile'],
    queryFn: getDoctorForCurrentUser,
  });

  const { data: appointments = [] } = useQuery({
    queryKey: ['doctor_appointments', doctor?.id],
    queryFn: () => getAppointmentsForDoctor(doctor.id),
    enabled: !!doctor?.id,
  });

  React.useEffect(() => {
    if (doctor && !profileForm) {
      setProfileForm({
        bio: doctor.bio || '',
        phone: doctor.phone || '',
        hospital: doctor.hospital || '',
        location: doctor.location || '',
        consultation_fee: String(doctor.consultation_fee ?? ''),
        accepts_online: doctor.accepts_online ?? true,
        accepts_physical: doctor.accepts_physical ?? true,
      });
    }
  }, [doctor, profileForm]);

  const [emailNotice, setEmailNotice] = useState('');

  const updateStatus = useMutation({
    mutationFn: ({ id, status }) => Appointment.update(id, { status }),
    onSuccess: async (_, { id, status }) => {
      qc.invalidateQueries({ queryKey: ['doctor_appointments', doctor?.id] });
      if (status !== 'confirmed' && status !== 'cancelled') return;

      const emailType = status === 'confirmed' ? 'confirmed' : 'declined';
      try {
        const emailResult = await sendAppointmentStatusEmail(id, emailType);
        if (emailResult?.ok) {
          setEmailNotice(
            status === 'confirmed'
              ? 'Appointment confirmed — yes email sent to the patient.'
              : 'Decline email sent to the patient.',
          );
        } else if (emailResult?.skipped) {
          setEmailNotice('Saved — no patient email on file, so no email was sent.');
        }
      } catch (err) {
        setEmailNotice(
          String(err?.message || '').includes('SMTP')
            ? 'Saved. Add SMTP secrets to the send-appointment-email Edge Function to enable emails.'
            : 'Saved. Email could not be sent — deploy the Edge Function and check patient email.',
        );
      }
      setTimeout(() => setEmailNotice(''), 6000);
    },
  });

  const saveProfile = useMutation({
    mutationFn: () =>
      updateDoctorProfile(doctor.id, {
        ...profileForm,
        consultation_fee: Number(profileForm.consultation_fee) || 0,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my_doctor_profile'] });
    },
  });

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center min-h-[50vh] bg-gray-50">
        <div className="w-8 h-8 border-4 border-rose-200 border-t-rose-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !doctor) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
        <h1 className="text-xl font-bold text-gray-900 mb-2">Doctor profile not linked</h1>
        <p className="text-sm text-gray-600 mb-4">
          Signed in as <strong>{user?.email}</strong>, but no doctor profile is linked to this
          account yet. Ask an admin to add you with this email, or sign up using the same email
          they used when creating your doctor listing.
        </p>
        <Link to="/">
          <Button className="rounded-full bg-rose-500 hover:bg-rose-600">Back to home</Button>
        </Link>
      </div>
    );
  }

  if (!doctor.is_verified) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <Stethoscope className="w-12 h-12 text-rose-400 mx-auto mb-4" />
        <h1 className="text-xl font-bold text-gray-900 mb-2">Pending verification</h1>
        <p className="text-sm text-gray-600">
          Your profile is waiting for admin approval. You will see appointments here once verified.
        </p>
      </div>
    );
  }

  const pending = appointments.filter((a) => a.status === 'pending');

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <div className="bg-white border-b sticky top-14 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Stethoscope className="w-5 h-5 text-rose-500" />
            Doctor Dashboard
          </h1>
          <p className="text-sm text-gray-500">
            {doctor.full_name} · {doctor.specialty}
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">
        {emailNotice && (
          <div className="mb-4 text-sm text-center bg-rose-50 border border-rose-200 text-rose-800 rounded-xl py-2 px-4">
            {emailNotice}
          </div>
        )}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-2xl border p-4">
            <div className="text-2xl font-bold text-rose-500">{pending.length}</div>
            <div className="text-xs text-gray-500">Pending requests</div>
          </div>
          <div className="bg-white rounded-2xl border p-4">
            <div className="text-2xl font-bold text-gray-900">{appointments.length}</div>
            <div className="text-xs text-gray-500">Total appointments</div>
          </div>
          <div className="bg-white rounded-2xl border p-4 col-span-2 md:col-span-1">
            <div className="text-sm font-medium text-gray-800 flex items-center gap-1">
              <Mail className="w-4 h-4" />
              {doctor.email}
            </div>
            <div className="text-xs text-gray-500 mt-1">{doctor.hospital}</div>
          </div>
        </div>

        <Tabs defaultValue="appointments">
          <TabsList className="mb-4 bg-white border rounded-xl p-1">
            <TabsTrigger value="appointments" className="rounded-lg text-sm">
              <Calendar className="w-4 h-4 mr-1" />
              Appointments
            </TabsTrigger>
            <TabsTrigger value="profile" className="rounded-lg text-sm">
              My profile
            </TabsTrigger>
          </TabsList>

          <TabsContent value="appointments">
            <div className="space-y-3">
              {appointments.map((apt) => (
                <div
                  key={apt.id}
                  className="bg-white rounded-2xl border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-sm">{apt.patient_name}</p>
                      <Badge className={`text-xs rounded-full ${STATUS_COLORS[apt.status]}`}>
                        {apt.status}
                      </Badge>
                      {apt.is_emergency && (
                        <Badge className="text-xs rounded-full bg-red-100 text-red-600">
                          Emergency
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {apt.date} at {apt.time} · {apt.type}
                    </p>
                    <p className="text-xs text-gray-400">
                      {apt.patient_email} · {apt.patient_phone}
                    </p>
                    {apt.reason && (
                      <p className="text-xs text-gray-600 mt-2 line-clamp-2">{apt.reason}</p>
                    )}
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    {apt.status === 'pending' && (
                      <>
                        <Button
                          size="sm"
                          className="bg-green-500 hover:bg-green-600 text-white rounded-full text-xs"
                          onClick={() =>
                            updateStatus.mutate({ id: apt.id, status: 'confirmed' })
                          }
                        >
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Confirm
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-red-200 text-red-500 rounded-full text-xs"
                          onClick={() =>
                            updateStatus.mutate({ id: apt.id, status: 'cancelled' })
                          }
                        >
                          <XCircle className="w-3 h-3 mr-1" />
                          Decline
                        </Button>
                      </>
                    )}
                    {apt.status === 'confirmed' && (
                      <Button
                        size="sm"
                        className="bg-blue-500 hover:bg-blue-600 text-white rounded-full text-xs"
                        onClick={() =>
                          updateStatus.mutate({ id: apt.id, status: 'completed' })
                        }
                      >
                        Mark completed
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              {appointments.length === 0 && (
                <p className="text-center text-gray-400 py-12">No appointments yet.</p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="profile">
            {profileForm && (
              <div className="bg-white rounded-2xl border p-6 space-y-4 max-w-xl">
                <p className="text-sm text-gray-500">
                  Name and specialty are managed by admin. You can update contact and availability
                  below.
                </p>
                {[
                  ['hospital', 'Hospital'],
                  ['location', 'Location'],
                  ['phone', 'Phone'],
                  ['consultation_fee', 'Consultation fee (ETB)'],
                ].map(([key, label]) => (
                  <div key={key}>
                    <Label className="text-xs text-gray-500">{label}</Label>
                    <Input
                      value={profileForm[key]}
                      onChange={(e) =>
                        setProfileForm((p) => ({ ...p, [key]: e.target.value }))
                      }
                      className="mt-1 rounded-xl"
                    />
                  </div>
                ))}
                <div>
                  <Label className="text-xs text-gray-500">Bio</Label>
                  <Textarea
                    value={profileForm.bio}
                    onChange={(e) => setProfileForm((p) => ({ ...p, bio: e.target.value }))}
                    className="mt-1 rounded-xl min-h-24"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Accepts online</Label>
                  <Switch
                    checked={profileForm.accepts_online}
                    onCheckedChange={(v) =>
                      setProfileForm((p) => ({ ...p, accepts_online: v }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Accepts in-person</Label>
                  <Switch
                    checked={profileForm.accepts_physical}
                    onCheckedChange={(v) =>
                      setProfileForm((p) => ({ ...p, accepts_physical: v }))
                    }
                  />
                </div>
                <Button
                  className="w-full rounded-xl bg-rose-500 hover:bg-rose-600"
                  onClick={() => saveProfile.mutate()}
                  disabled={saveProfile.isPending}
                >
                  {saveProfile.isPending ? 'Saving…' : 'Save profile'}
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
