import { useState, type FormEvent } from 'react';
import { BookOpen, Plus, Search, Edit2, Trash2, X, FileText } from 'lucide-react';
import { type Lesson } from '../lib/db';

interface LessonsManagerProps {
  lessons: Lesson[];
  onSave: (lesson: Omit<Lesson, 'id'> & { id?: string }) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export const LessonsManager = ({ lessons, onSave, onDelete }: LessonsManagerProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentLesson, setCurrentLesson] = useState<Partial<Lesson> | null>(null);

  // تصفية الدروس بناءً على البحث
  const filteredLessons = lessons.filter(lesson =>
    lesson.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (lesson.description && lesson.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleOpenAddModal = () => {
    setCurrentLesson({ name: '', description: '' });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (lesson: Lesson) => {
    setCurrentLesson(lesson);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentLesson(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!currentLesson?.name?.trim()) return;
    
    await onSave(currentLesson as Lesson);
    handleCloseModal();
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذه المادة؟ سيؤدي ذلك لحذف جميع الأفواج والاشتراكات المرتبطة بها.')) {
      await onDelete(id);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-title">
          <h2>إدارة المواد الدراسية</h2>
          <p>إعداد وتعديل المواد الدراسية المتاحة بالمركز</p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenAddModal}>
          <Plus size={18} />
          إضافة مادة دراسية جديدة
        </button>
      </div>

      {/* شريط البحث والتصفية */}
      <div className="filters-container">
        <div className="filter-group">
          <label className="filter-label">البحث عن مادة</label>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              className="filter-input"
              placeholder="ابحث باسم المادة أو الوصف..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '100%', paddingRight: '40px' }}
            />
            <Search size={18} style={{ position: 'absolute', right: '14px', top: '12px', color: 'var(--text-light)' }} />
          </div>
        </div>
      </div>

      {/* شبكة بطاقات الدروس */}
      {filteredLessons.length > 0 ? (
        <div className="cards-grid">
          {filteredLessons.map(lesson => (
            <div key={lesson.id} className="card">
              <div className="card-header">
                <div>
                  <h3 className="card-title">{lesson.name}</h3>
                  <span className="badge badge-green" style={{ marginTop: '6px' }}>
                    <BookOpen size={12} style={{ marginLeft: '4px' }} />
                    نشط
                  </span>
                </div>
              </div>
              
              <div className="card-body">
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.6' }}>
                  {lesson.description || 'لا يوجد وصف متاح لهذه المادة حالياً.'}
                </p>
              </div>

              <div className="card-footer">
                <div style={{ display: 'flex', gap: '8px', width: '100%', justifyContent: 'flex-end' }}>
                  <button 
                    className="btn-icon-only" 
                    title="تعديل" 
                    onClick={() => handleOpenEditModal(lesson)}
                  >
                    <Edit2 size={16} />
                  </button>
                  <button 
                    className="btn-icon-only danger" 
                    title="حذف" 
                    onClick={() => handleDelete(lesson.id)}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="no-data-card">
          <FileText className="no-data-icon" size={48} />
          <h4 className="no-data-text">لم يتم العثور على أي مواد دراسية</h4>
          <p>جرب تغيير كلمة البحث أو أضف مادة دراسية جديدة للبدء.</p>
        </div>
      )}

      {/* نافذة الإضافة والتعديل */}
      {isModalOpen && currentLesson && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">
                {currentLesson.id ? 'تعديل بيانات المادة' : 'إضافة مادة دراسية جديدة'}
              </h3>
              <button className="modal-close-btn" onClick={handleCloseModal}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">اسم المادة الدراسية *</label>
                    <input
                      type="text"
                      className="form-input"
                      required
                      placeholder="مثال: اللغة الإنجليزية"
                      value={currentLesson.name || ''}
                      onChange={(e) => setCurrentLesson({ ...currentLesson, name: e.target.value })}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">وصف المادة</label>
                    <textarea
                      className="form-input"
                      rows={4}
                      placeholder="اكتب وصفاً للمادة، وأهدافها التعليمية..."
                      value={currentLesson.description || ''}
                      onChange={(e) => setCurrentLesson({ ...currentLesson, description: e.target.value })}
                      style={{ resize: 'vertical' }}
                    />
                  </div>
                </div>
              </div>
              
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={handleCloseModal}>
                  إلغاء
                </button>
                <button type="submit" className="btn btn-primary">
                  حفظ البيانات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
