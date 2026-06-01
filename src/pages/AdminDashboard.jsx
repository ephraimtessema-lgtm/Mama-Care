import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Doctor, Appointment, Article } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Link } from "react-router-dom";
import { ArrowLeft, Plus, CheckCircle, XCircle, Edit, Trash2, Users, Calendar, BookOpen, Stethoscope } from "lucide-react";
import { linkDoctorToUser } from "@/api/admin";

const EMPTY_DOCTOR = { full_name: "", specialty: "OB-GYN", bio: "", hospital: "", location: "", phone: "", email: "", years_experience: "", consultation_fee: "", rating: "", is_verified: false, accepts_online: true, accepts_physical: true };
const EMPTY_ARTICLE = { title: "", summary: "", content: "", category: "nutrition", trimester: "all", read_time_minutes: "", is_published: true };

export default function AdminDashboard() {
  const qc = useQueryClient();
  const [doctorForm, setDoctorForm] = useState(EMPTY_DOCTOR);
  const [articleForm, setArticleForm] = useState(EMPTY_ARTICLE);
  const [showDoctorModal, setShowDoctorModal] = useState(false);
  const [showArticleModal, setShowArticleModal] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState(null);
  const [editingArticle, setEditingArticle] = useState(null);
  const [linkAccountEmail, setLinkAccountEmail] = useState("");
  const [doctorSaveNotice, setDoctorSaveNotice] = useState("");

  const { data: doctors = [] } = useQuery({ queryKey: ["all_doctors"], queryFn: () => Doctor.list() });
  const { data: appointments = [] } = useQuery({ queryKey: ["all_appointments"], queryFn: () => Appointment.list("-created_date", 30) });
  const { data: articles = [] } = useQuery({ queryKey: ["all_articles"], queryFn: () => Article.list() });

  const saveDoctor = useMutation({
    mutationFn: async () => {
      const data = {
        ...doctorForm,
        years_experience: Number(doctorForm.years_experience) || 0,
        consultation_fee: Number(doctorForm.consultation_fee) || 0,
        rating: Number(doctorForm.rating) || 0,
      };
      let doctorId;
      if (editingDoctor) {
        await Doctor.update(editingDoctor.id, data);
        doctorId = editingDoctor.id;
      } else {
        const created = await Doctor.create(data);
        doctorId = created.id;
      }
      if (linkAccountEmail.trim()) {
        await linkDoctorToUser(doctorId, linkAccountEmail.trim());
      }
      return doctorId;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["all_doctors"] });
      setShowDoctorModal(false);
      setDoctorForm(EMPTY_DOCTOR);
      setEditingDoctor(null);
      setLinkAccountEmail("");
      setDoctorSaveNotice(
        linkAccountEmail.trim()
          ? "Doctor saved and portal account linked."
          : "Doctor saved. Add a portal email to link their login, or they can sign up with the same email as the doctor listing.",
      );
    },
    onError: (err) => {
      setDoctorSaveNotice(err.message || "Could not save doctor.");
    },
  });

  const deleteDoctor = useMutation({
    mutationFn: (id) => Doctor.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["all_doctors"] }),
  });

  const saveArticle = useMutation({
    mutationFn: () => {
      const data = { ...articleForm, read_time_minutes: Number(articleForm.read_time_minutes) };
      return editingArticle ? Article.update(editingArticle.id, data) : Article.create(data);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["all_articles"] }); setShowArticleModal(false); setArticleForm(EMPTY_ARTICLE); setEditingArticle(null); },
  });

  const deleteArticle = useMutation({
    mutationFn: (id) => Article.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["all_articles"] }),
  });

  const updateAppointmentStatus = useMutation({
    mutationFn: ({ id, status }) => Appointment.update(id, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["all_appointments"] }),
  });

  const openEditDoctor = (doc) => {
    setEditingDoctor(doc);
    setDoctorForm({ ...doc, years_experience: String(doc.years_experience || ""), consultation_fee: String(doc.consultation_fee || ""), rating: String(doc.rating || "") });
    setLinkAccountEmail(doc.email || "");
    setShowDoctorModal(true);
  };
  const openEditArticle = (art) => { setEditingArticle(art); setArticleForm({ ...art, read_time_minutes: String(art.read_time_minutes || "") }); setShowArticleModal(true); };

  const STATUS_COLORS = { pending: "bg-yellow-100 text-yellow-700", confirmed: "bg-blue-100 text-blue-700", completed: "bg-green-100 text-green-700", cancelled: "bg-red-100 text-red-700" };

  const stats = [
    { label: "Total Doctors", value: doctors.length, icon: <Stethoscope className="w-5 h-5 text-rose-500" />, bg: "bg-rose-50" },
    { label: "Appointments", value: appointments.length, icon: <Calendar className="w-5 h-5 text-blue-500" />, bg: "bg-blue-50" },
    { label: "Articles", value: articles.length, icon: <BookOpen className="w-5 h-5 text-purple-500" />, bg: "bg-purple-50" },
    { label: "Pending", value: appointments.filter(a => a.status === "pending").length, icon: <Users className="w-5 h-5 text-orange-500" />, bg: "bg-orange-50" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b sticky top-14 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/"><Button variant="ghost" size="icon" className="rounded-full"><ArrowLeft className="w-4 h-4" /></Button></Link>
            <div>
              <h1 className="text-xl font-bold text-gray-900">⚙️ Admin Dashboard</h1>
              <p className="text-xs text-gray-400">Mama-Care Management</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {doctorSaveNotice && (
          <div className="mb-4 text-sm bg-rose-50 border border-rose-200 text-rose-800 rounded-xl px-4 py-3">
            {doctorSaveNotice}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {stats.map(s => (
            <div key={s.label} className={`${s.bg} rounded-2xl p-4 flex items-center gap-3`}>
              <div className="p-2 bg-white rounded-xl shadow-sm">{s.icon}</div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{s.value}</div>
                <div className="text-xs text-gray-500">{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        <Tabs defaultValue="doctors">
          <TabsList className="mb-4 bg-white border rounded-xl p-1">
            <TabsTrigger value="doctors" className="rounded-lg text-sm">👩‍⚕️ Doctors</TabsTrigger>
            <TabsTrigger value="appointments" className="rounded-lg text-sm">📅 Appointments</TabsTrigger>
            <TabsTrigger value="articles" className="rounded-lg text-sm">📚 Articles</TabsTrigger>
          </TabsList>

          {/* Doctors Tab */}
          <TabsContent value="doctors">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-gray-900">Doctor Management</h2>
              <Button onClick={() => { setEditingDoctor(null); setDoctorForm(EMPTY_DOCTOR); setLinkAccountEmail(""); setShowDoctorModal(true); }} className="bg-rose-500 hover:bg-rose-600 text-white rounded-full gap-1 text-sm">
                <Plus className="w-4 h-4" /> Add Doctor
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {doctors.map(doc => (
                <div key={doc.id} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-semibold text-sm text-gray-900">{doc.full_name}</p>
                      <p className="text-xs text-rose-500">{doc.specialty}</p>
                    </div>
                    <Badge className={`text-xs rounded-full ${doc.is_verified ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                      {doc.is_verified ? "✓ Verified" : "Pending"}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-400 mb-3">{doc.hospital} • {doc.location}</p>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => openEditDoctor(doc)} className="flex-1 rounded-xl text-xs gap-1"><Edit className="w-3 h-3" /> Edit</Button>
                    <Button size="sm" variant="outline" onClick={() => deleteDoctor.mutate(doc.id)} className="rounded-xl text-xs text-red-500 border-red-200 hover:bg-red-50"><Trash2 className="w-3 h-3" /></Button>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Appointments Tab */}
          <TabsContent value="appointments">
            <h2 className="font-bold text-gray-900 mb-4">Appointment Requests</h2>
            <div className="space-y-3">
              {appointments.map(apt => (
                <div key={apt.id} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-sm text-gray-900">{apt.patient_name}</p>
                      <Badge className={`text-xs rounded-full ${STATUS_COLORS[apt.status]}`}>{apt.status}</Badge>
                      {apt.is_emergency && <Badge className="text-xs rounded-full bg-red-100 text-red-600">🚨 Emergency</Badge>}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">with {apt.doctor_name} • {apt.date} at {apt.time} • {apt.type}</p>
                    {apt.reason && <p className="text-xs text-gray-400 mt-1 line-clamp-1">{apt.reason}</p>}
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    {apt.status === "pending" && (
                      <>
                        <Button size="sm" onClick={() => updateAppointmentStatus.mutate({ id: apt.id, status: "confirmed" })} className="bg-green-500 hover:bg-green-600 text-white rounded-full text-xs gap-1">
                          <CheckCircle className="w-3 h-3" /> Confirm
                        </Button>
                        <Button size="sm" onClick={() => updateAppointmentStatus.mutate({ id: apt.id, status: "cancelled" })} variant="outline" className="border-red-200 text-red-500 hover:bg-red-50 rounded-full text-xs gap-1">
                          <XCircle className="w-3 h-3" /> Cancel
                        </Button>
                      </>
                    )}
                    {apt.status === "confirmed" && (
                      <Button size="sm" onClick={() => updateAppointmentStatus.mutate({ id: apt.id, status: "completed" })} className="bg-blue-500 hover:bg-blue-600 text-white rounded-full text-xs">Mark Done</Button>
                    )}
                  </div>
                </div>
              ))}
              {appointments.length === 0 && <div className="text-center py-12 text-gray-400">No appointments yet</div>}
            </div>
          </TabsContent>

          {/* Articles Tab */}
          <TabsContent value="articles">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-gray-900">Article Management</h2>
              <Button onClick={() => { setEditingArticle(null); setArticleForm(EMPTY_ARTICLE); setShowArticleModal(true); }} className="bg-rose-500 hover:bg-rose-600 text-white rounded-full gap-1 text-sm">
                <Plus className="w-4 h-4" /> Add Article
              </Button>
            </div>
            <div className="space-y-3">
              {articles.map(art => (
                <div key={art.id} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm flex items-center justify-between gap-3">
                  <div className="flex-1">
                    <p className="font-semibold text-sm text-gray-900">{art.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{art.category} • {art.trimester}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge className={`text-xs rounded-full ${art.is_published ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-500"}`}>{art.is_published ? "Published" : "Draft"}</Badge>
                    <Button size="sm" variant="outline" onClick={() => openEditArticle(art)} className="rounded-xl text-xs gap-1"><Edit className="w-3 h-3" /></Button>
                    <Button size="sm" variant="outline" onClick={() => deleteArticle.mutate(art.id)} className="rounded-xl text-xs text-red-500 border-red-200 hover:bg-red-50"><Trash2 className="w-3 h-3" /></Button>
                  </div>
                </div>
              ))}
              {articles.length === 0 && <div className="text-center py-12 text-gray-400">No articles yet</div>}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Doctor Modal */}
      <Dialog open={showDoctorModal} onOpenChange={setShowDoctorModal}>
        <DialogContent className="max-w-lg rounded-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingDoctor ? "Edit Doctor" : "Add New Doctor"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {[["full_name","Full Name *"], ["specialty","Specialty"], ["hospital","Hospital"], ["location","Location"], ["phone","Phone"], ["email","Email"], ["years_experience","Years Experience"], ["consultation_fee","Fee (ETB)"], ["rating","Rating (1-5)"]].map(([k, l]) => (
              <div key={k}>
                <Label className="text-xs text-gray-500 mb-1 block">{l}</Label>
                <Input value={doctorForm[k] || ""} onChange={e => setDoctorForm(p => ({ ...p, [k]: e.target.value }))} className="rounded-xl text-sm" />
              </div>
            ))}
            <div>
              <Label className="text-xs text-gray-500 mb-1 block">Bio</Label>
              <Textarea value={doctorForm.bio || ""} onChange={e => setDoctorForm(p => ({ ...p, bio: e.target.value }))} className="rounded-xl text-sm min-h-16" />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-sm">Verified</Label>
              <Switch checked={doctorForm.is_verified} onCheckedChange={v => setDoctorForm(p => ({ ...p, is_verified: v }))} />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-sm">Accepts Online</Label>
              <Switch checked={doctorForm.accepts_online} onCheckedChange={v => setDoctorForm(p => ({ ...p, accepts_online: v }))} />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-sm">Accepts Physical</Label>
              <Switch checked={doctorForm.accepts_physical} onCheckedChange={v => setDoctorForm(p => ({ ...p, accepts_physical: v }))} />
            </div>
            <div className="border-t border-gray-100 pt-3">
              <Label className="text-xs text-gray-500 mb-1 block">Portal login email (optional)</Label>
              <Input
                type="email"
                value={linkAccountEmail}
                onChange={(e) => setLinkAccountEmail(e.target.value)}
                placeholder="doctor@gmail.com — must already have signed up"
                className="rounded-xl text-sm"
              />
              <p className="text-xs text-gray-400 mt-1.5">
                Links this doctor to an existing Mama-Care account and sets their role to doctor. If they have not signed up yet, use the same email above as &quot;Email&quot; and they will auto-link when they register.
              </p>
            </div>
            <Button onClick={() => saveDoctor.mutate()} disabled={!doctorForm.full_name || saveDoctor.isPending} className="w-full bg-rose-500 hover:bg-rose-600 text-white rounded-xl">
              {saveDoctor.isPending ? "Saving..." : "Save Doctor"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Article Modal */}
      <Dialog open={showArticleModal} onOpenChange={setShowArticleModal}>
        <DialogContent className="max-w-lg rounded-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingArticle ? "Edit Article" : "Add New Article"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {[["title","Title *"], ["summary","Summary"], ["image_url","Image URL"], ["read_time_minutes","Read Time (minutes)"]].map(([k, l]) => (
              <div key={k}>
                <Label className="text-xs text-gray-500 mb-1 block">{l}</Label>
                <Input value={articleForm[k] || ""} onChange={e => setArticleForm(p => ({ ...p, [k]: e.target.value }))} className="rounded-xl text-sm" />
              </div>
            ))}
            <div>
              <Label className="text-xs text-gray-500 mb-1 block">Content *</Label>
              <Textarea value={articleForm.content || ""} onChange={e => setArticleForm(p => ({ ...p, content: e.target.value }))} className="rounded-xl text-sm min-h-32" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-gray-500 mb-1 block">Category</Label>
                <select value={articleForm.category} onChange={e => setArticleForm(p => ({ ...p, category: e.target.value }))} className="w-full border rounded-xl text-sm px-3 py-2">
                  {["nutrition","exercise","mental_health","symptoms","labor","postpartum","newborn_care","emergency_signs"].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <Label className="text-xs text-gray-500 mb-1 block">Trimester</Label>
                <select value={articleForm.trimester} onChange={e => setArticleForm(p => ({ ...p, trimester: e.target.value }))} className="w-full border rounded-xl text-sm px-3 py-2">
                  {["all","first","second","third"].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-sm">Published</Label>
              <Switch checked={articleForm.is_published} onCheckedChange={v => setArticleForm(p => ({ ...p, is_published: v }))} />
            </div>
            <Button onClick={() => saveArticle.mutate()} disabled={!articleForm.title || !articleForm.content || saveArticle.isPending} className="w-full bg-rose-500 hover:bg-rose-600 text-white rounded-xl">
              {saveArticle.isPending ? "Saving..." : "Save Article"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}