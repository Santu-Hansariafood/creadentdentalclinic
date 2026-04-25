import { useState } from 'react'
import { motion } from 'framer-motion'
import { FileText, Download, Eye, Search, Filter, Calendar, User } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { medicalRecords } from '../data/mockData'
import { fadeIn, staggerContainer } from '../utils/motion'
import toast from 'react-hot-toast'

const MedicalRecords = () => {
  const { user } = useAuth()
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('All')
  const [selectedRecord, setSelectedRecord] = useState(null)

  const userRecords = medicalRecords.filter(rec => {
    if (user.role === 'patient') return rec.patientId === user.id
    return true
  })

  const filteredRecords = userRecords.filter(rec => {
    const matchesSearch = rec.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         rec.diagnosis.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         rec.treatment.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = filterType === 'All' || rec.visitType === filterType
    return matchesSearch && matchesType
  })

  const handleDownload = (record) => {
    toast.success('Downloading medical record...')
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <motion.div {...fadeIn('down')} className="mb-8">
        <h1 className="font-heading text-3xl font-bold text-gray-900 mb-2">
          Medical Records
        </h1>
        <p className="text-gray-600">View and manage patient medical records</p>
      </motion.div>

      <motion.div {...fadeIn('up', 0.1)} className="card mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search records..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={20} className="text-gray-600" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="input-field"
            >
              <option value="All">All Types</option>
              <option value="Check-up">Check-up</option>
              <option value="Treatment">Treatment</option>
              <option value="Consultation">Consultation</option>
            </select>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="lg:col-span-2 space-y-4"
        >
          {filteredRecords.length > 0 ? (
            filteredRecords.map((record, index) => (
              <motion.div
                key={record.id}
                {...fadeIn('up', index * 0.05)}
                onClick={() => setSelectedRecord(record)}
                className={`card-hover cursor-pointer ${
                  selectedRecord?.id === record.id ? 'ring-2 ring-primary' : ''
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                      <FileText size={24} className="text-primary" />
                    </div>
                    <div>
                      <h3 className="font-heading font-semibold text-gray-900">
                        {record.visitType} - {record.diagnosis}
                      </h3>
                      <p className="text-sm text-gray-600">{record.patientName}</p>
                    </div>
                  </div>
                  <span className="badge badge-primary">
                    {new Date(record.date).toLocaleDateString()}
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <User size={16} />
                    <span>Dr. {record.doctorName}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar size={16} />
                    <span>{new Date(record.date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}</span>
                  </div>
                </div>

                <div className="p-3 bg-gray-50 rounded-lg mb-4">
                  <p className="text-sm text-gray-700 line-clamp-2">{record.notes}</p>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    {record.attachments.map((att, idx) => (
                      <span key={idx} className="badge badge-info text-xs">
                        {att.type === 'image' ? '📷' : '📄'} {att.name}
                      </span>
                    ))}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDownload(record)
                    }}
                    className="text-primary hover:text-primary/80 transition-colors"
                  >
                    <Download size={18} />
                  </button>
                </div>
              </motion.div>
            ))
          ) : (
            <motion.div {...fadeIn('up')} className="card text-center py-12">
              <FileText size={64} className="mx-auto mb-4 text-gray-300" />
              <h3 className="font-heading text-xl font-semibold text-gray-900 mb-2">
                No records found
              </h3>
              <p className="text-gray-600">
                {searchTerm || filterType !== 'All'
                  ? 'Try adjusting your search or filter'
                  : 'No medical records available'}
              </p>
            </motion.div>
          )}
        </motion.div>

        <motion.div {...fadeIn('left', 0.2)} className="lg:col-span-1">
          {selectedRecord ? (
            <div className="card sticky top-6">
              <h2 className="font-heading text-xl font-semibold text-gray-900 mb-4">
                Record Details
              </h2>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">Patient</p>
                  <p className="text-gray-900">{selectedRecord.patientName}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">Doctor</p>
                  <p className="text-gray-900">{selectedRecord.doctorName}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">Visit Type</p>
                  <span className="badge badge-primary">{selectedRecord.visitType}</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">Diagnosis</p>
                  <p className="text-gray-900">{selectedRecord.diagnosis}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">Treatment</p>
                  <p className="text-gray-900">{selectedRecord.treatment}</p>
                </div>
                {selectedRecord.prescriptions.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Prescriptions</p>
                    <ul className="space-y-1">
                      {selectedRecord.prescriptions.map((pres, idx) => (
                        <li key={idx} className="text-sm text-gray-600">• {pres}</li>
                      ))}
                    </ul>
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">Vital Signs</p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-gray-600">BP</p>
                      <p className="text-gray-900">{selectedRecord.vitalSigns.bloodPressure}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Heart Rate</p>
                      <p className="text-gray-900">{selectedRecord.vitalSigns.heartRate} bpm</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Temperature</p>
                      <p className="text-gray-900">{selectedRecord.vitalSigns.temperature}°F</p>
                    </div>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">Notes</p>
                  <p className="text-sm text-gray-600">{selectedRecord.notes}</p>
                </div>
                {selectedRecord.followUpDate && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-1">Follow-up</p>
                    <p className="text-gray-900">
                      {new Date(selectedRecord.followUpDate).toLocaleDateString()}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Attachments</p>
                  <div className="space-y-2">
                    {selectedRecord.attachments.map((att, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{att.type === 'image' ? '📷' : '📄'}</span>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{att.name}</p>
                            <p className="text-xs text-gray-500">{att.size}</p>
                          </div>
                        </div>
                        <button className="text-primary hover:text-primary/80">
                          <Download size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => handleDownload(selectedRecord)}
                  className="btn-primary w-full"
                >
                  <Download size={18} className="inline mr-2" />
                  Download Record
                </button>
              </div>
            </div>
          ) : (
            <div className="card text-center py-12">
              <Eye size={48} className="mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500">Select a record to view details</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}

export default MedicalRecords