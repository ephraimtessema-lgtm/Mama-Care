import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Doctor } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { ArrowLeft, Star, MapPin, Clock, Video, Building2, Search, CheckCircle } from "lucide-react";

export default function Doctors() {
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");

  const { data: doctors = [], isLoading } = useQuery({
    queryKey: ["doctors"],
    queryFn: () => Doctor.filter({ is_verified: true }),
  });

  const filtered = doctors.filter(d => {
    const matchSearch = d.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      d.hospital?.toLowerCase().includes(search.toLowerCase()) ||
      d.location?.toLowerCase().includes(search.toLowerCase());
    if (filterType === "online") return matchSearch && d.accepts_online;
    if (filterType === "physical") return matchSearch && d.accepts_physical;
    return matchSearch;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-14 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3 mb-4">
            <Link to="/"><Button variant="ghost" size="icon" className="rounded-full"><ArrowLeft className="w-4 h-4" /></Button></Link>
            <div>
              <h1 className="text-xl font-bold text-gray-900">🏥 Doctor Directory</h1>
              <p className="text-xs text-gray-400">Verified OB-GYN Specialists</p>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, hospital, location..." className="pl-9 rounded-full h-9 text-sm" />
            </div>
            <div className="flex gap-1">
              {[["all", "All"], ["online", "Online"], ["physical", "In-Person"]].map(([v, l]) => (
                <Button key={v} size="sm" onClick={() => setFilterType(v)}
                  variant={filterType === v ? "default" : "outline"}
                  className={`rounded-full text-xs ${filterType === v ? "bg-rose-500 hover:bg-rose-600" : "border-rose-200 text-rose-600 hover:bg-rose-50"}`}>
                  {l}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Doctors Grid */}
      <div className="max-w-5xl mx-auto px-4 py-6">
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="bg-white rounded-2xl p-5 animate-pulse">
                <div className="w-16 h-16 bg-gray-200 rounded-full mb-3"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        )}

        {!isLoading && filtered.length === 0 && (
          <div className="text-center py-20">
            <div className="text-5xl mb-3">👩‍⚕️</div>
            <p className="text-gray-500 mb-2">No doctors found</p>
            <p className="text-gray-400 text-sm">Try adjusting your search</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(doc => (
            <div key={doc.id} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start gap-3 mb-3">
                <div className="relative">
                  {doc.photo_url ? (
                    <img src={doc.photo_url} alt={doc.full_name} className="w-14 h-14 rounded-full object-cover" />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-rose-100 flex items-center justify-center text-2xl">👩‍⚕️</div>
                  )}
                  {doc.is_verified && (
                    <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-0.5">
                      <CheckCircle className="w-3 h-3 text-white" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 text-sm">{doc.full_name}</h3>
                  <p className="text-xs text-rose-500">{doc.specialty}</p>
                  {doc.rating && (
                    <div className="flex items-center gap-1 mt-1">
                      <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                      <span className="text-xs font-medium">{doc.rating}</span>
                      <span className="text-xs text-gray-400">({doc.total_reviews} reviews)</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-1 mb-3">
                {doc.hospital && (
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Building2 className="w-3 h-3" /> {doc.hospital}
                  </div>
                )}
                {doc.location && (
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <MapPin className="w-3 h-3" /> {doc.location}
                  </div>
                )}
                {doc.years_experience && (
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Clock className="w-3 h-3" /> {doc.years_experience} years experience
                  </div>
                )}
              </div>

              <div className="flex gap-1 mb-3 flex-wrap">
                {doc.accepts_online && <Badge className="text-xs bg-blue-100 text-blue-600 rounded-full gap-1"><Video className="w-2.5 h-2.5" /> Online</Badge>}
                {doc.accepts_physical && <Badge className="text-xs bg-green-100 text-green-600 rounded-full gap-1"><Building2 className="w-2.5 h-2.5" /> In-Person</Badge>}
              </div>

              {doc.consultation_fee && (
                <p className="text-xs text-gray-500 mb-3">Consultation: <span className="font-semibold text-gray-700">{doc.consultation_fee} ETB</span></p>
              )}

              <Link to={`/book?doctor=${doc.id}&name=${encodeURIComponent(doc.full_name)}`}>
                <Button className="w-full bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-sm">Book Appointment</Button>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}