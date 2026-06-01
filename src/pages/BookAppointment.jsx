import React, { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Appointment } from "@/api/entities";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Link } from "react-router-dom";
import { ArrowLeft, Calendar, Clock, Video, Building2, CheckCircle, AlertTriangle } from "lucide-react";

const TIME_SLOTS = ["08:00 AM", "09:00 AM", "10:00 AM", "11:00 AM", "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM"];

export default function BookAppointment() {
  const { user } = useAuth();
  const params = new URLSearchParams(window.location.search);
  const doctorId = params.get("doctor");
  const doctorName = params.get("name") || "Selected Doctor";
  const isEmergency = params.get("emergency") === "true";

  const [form, setForm] = useState({
    patient_name: "",
    patient_email: "",
    patient_phone: "",
    date: "",
    time: "",
    type: "online",
    reason: "",
    is_emergency: isEmergency,
  });
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (user) {
      setForm((p) => ({
        ...p,
        patient_name: p.patient_name || user.full_name || "",
        patient_email: p.patient_email || user.email || "",
      }));
    }
  }, [user]);

  const book = useMutation({
    mutationFn: () => Appointment.create({
      ...form,
      user_id: user?.id,
      doctor_id: doctorId,
      doctor_name: doctorName,
      status: "pending",
    }),
    onSuccess: () => setSubmitted(true),
  });

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  if (submitted) {
    return (
      <div className="min-h-screen bg-rose-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl p-10 text-center max-w-md shadow-lg">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Appointment Booked! 🎉</h2>
          <p className="text-gray-500 mb-1">with <span className="font-semibold">{doctorName}</span></p>
          <p className="text-gray-400 text-sm mb-6">on {form.date} at {form.time}</p>
          <p className="text-sm text-gray-500 bg-rose-50 rounded-xl p-3 mb-6">
            Your request was sent to <strong>{doctorName}</strong>. When they approve it, you'll get a confirmation email
            {form.patient_email ? (
              <> at <strong>{form.patient_email}</strong></>
            ) : (
              <> — add an email next time so we can notify you automatically</>
            )}
            . We can also reach you at <strong>{form.patient_phone}</strong> if needed.
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link to="/"><Button variant="outline" className="rounded-full border-rose-300 text-rose-600">Back to Home</Button></Link>
            <Link to="/doctors"><Button className="bg-rose-500 hover:bg-rose-600 text-white rounded-full">Find Another Doctor</Button></Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-rose-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link to="/doctors"><Button variant="ghost" size="icon" className="rounded-full"><ArrowLeft className="w-4 h-4" /></Button></Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Book Appointment</h1>
            <p className="text-sm text-rose-500">with {doctorName}</p>
          </div>
        </div>

        {/* Emergency Banner */}
        {isEmergency && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-5 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-700 text-sm">Emergency Booking</p>
              <p className="text-red-500 text-xs">This appointment has been flagged as urgent. The doctor will prioritize your case.</p>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-rose-100 shadow-sm p-6 space-y-5">
          {/* Consultation Type */}
          <div>
            <Label className="text-sm font-semibold text-gray-700 mb-2 block">Consultation Type</Label>
            <div className="flex gap-3">
              {[
                { v: "online", l: "Online Video", Ico: Video },
                { v: "physical", l: "In-Person", Ico: Building2 }
              ].map(({ v, l, Ico }) => (
                <button key={v} onClick={() => set("type", v)}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 transition-all text-sm font-medium
                    ${form.type === v ? "border-rose-400 bg-rose-50 text-rose-600" : "border-gray-200 text-gray-500 hover:border-rose-200"}`}>
                  <Ico className="w-4 h-4" /> {l}
                </button>
              ))}
            </div>
          </div>

          {/* Date */}
          <div>
            <Label className="text-sm font-semibold text-gray-700 mb-2 block"><Calendar className="w-4 h-4 inline mr-1" />Select Date</Label>
            <Input type="date" value={form.date} onChange={e => set("date", e.target.value)}
              min={new Date().toISOString().split("T")[0]}
              className="rounded-xl border-gray-200" />
          </div>

          {/* Time */}
          <div>
            <Label className="text-sm font-semibold text-gray-700 mb-2 block"><Clock className="w-4 h-4 inline mr-1" />Select Time</Label>
            <div className="grid grid-cols-4 gap-2">
              {TIME_SLOTS.map(t => (
                <button key={t} onClick={() => set("time", t)}
                  className={`py-2 rounded-xl text-sm transition-all border
                    ${form.time === t ? "bg-rose-500 text-white border-rose-500" : "border-gray-200 text-gray-600 hover:border-rose-300"}`}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Patient Info */}
          <div className="border-t border-gray-100 pt-4 space-y-3">
            <p className="text-sm font-semibold text-gray-700">Your Information</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-gray-500 mb-1 block">Full Name *</Label>
                <Input value={form.patient_name} onChange={e => set("patient_name", e.target.value)} placeholder="Your real name (private)" className="rounded-xl text-sm" />
              </div>
              <div>
                <Label className="text-xs text-gray-500 mb-1 block">Phone Number *</Label>
                <Input value={form.patient_phone} onChange={e => set("patient_phone", e.target.value)} placeholder="+251..." className="rounded-xl text-sm" />
              </div>
            </div>
            <div>
              <Label className="text-xs text-gray-500 mb-1 block">Email (for confirmation when doctor approves)</Label>
              <Input type="email" value={form.patient_email} onChange={e => set("patient_email", e.target.value)} placeholder="your@email.com" className="rounded-xl text-sm" />
            </div>
            <div>
              <Label className="text-xs text-gray-500 mb-1 block">Reason for Visit</Label>
              <Textarea value={form.reason} onChange={e => set("reason", e.target.value)} placeholder="Describe your symptoms or reason for the appointment..." className="rounded-xl text-sm min-h-20" />
            </div>
          </div>

          <div className="bg-rose-50 rounded-xl p-3 text-xs text-rose-600">
            🔒 Your personal information is private and only shared with the doctor you book.
          </div>

          <Button
            onClick={() => book.mutate()}
            disabled={!form.patient_name || !form.patient_phone || !form.patient_email || !form.date || !form.time || book.isPending}
            className="w-full bg-rose-500 hover:bg-rose-600 text-white rounded-xl h-12 text-base font-semibold">
            {book.isPending ? "Booking..." : "Confirm Appointment 📅"}
          </Button>
        </div>
      </div>
    </div>
  );
}