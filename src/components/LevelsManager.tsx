import { useState, type FormEvent } from 'react';
import { Plus, Search, Edit2, Trash2, X, FileText, CheckCircle2 } from 'lucide-react';
import { type AcademicLevel } from '../lib/db';

interface LevelsManagerProps {
  levels: AcademicLevel[];
  onSave: (level: Omit<AcademicLevel, 'id'> & { id?: string }) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export const LevelsManager = ({ levels, onSave, onDelete }: LevelsManagerProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStageTab, setSelectedStageTab] = useState<'all' | 'primary' | 'middle' | 'high' | 'university' | 'other'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentLevel, setCurrentLevel] = useState<Partial<AcademicLevel> | null>(null);
  const [newSpec, setNewSpec] = useState('');
  const [isGeneral, setIsGeneral] = useState(true);

  // تصفية المستويات بناءً على البحث والتبويب المحدد
  const filteredLevels = levels.filter(level => {
    const matchesSearch = level.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      level.specializations.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStage = selectedStageTab === 'all' || level.stage === selectedStageTab;
    
    return matchesSearch && matchesStage;
  });

  const handleOpenAddModal = () => {
    setCurrentLevel({
      name: '',
      stage: 'primary',
      specializations: ['عام']
    });
    setIsGeneral(true);
    setNewSpec('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (level: AcademicLevel) => {
    setCurrentLevel(level);
    const hasOnlyGeneral = level.specializations.length === 1 && level.specializations[0] === 'عام';
    setIsGeneral(hasOnlyGeneral);
    setNewSpec('');
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentLevel(null);
    setNewSpec('');
  };

  const handleAddSpecialization = () => {
    if (!newSpec.trim() || !currentLevel) return;
    const currentSpecs = currentLevel.specializations || [];
    
    // تجنب التكرار
    if (currentSpecs.includes(newSpec.trim())) {
      setNewSpec('');
      return;
    }

    // إزالة "عام" إذا كان موجوداً عند إضافة تخصص حقيقي
    const updatedSpecs = currentSpecs.filter(s => s !== 'عام').concat(newSpec.trim());
    
    setCurrentLevel({
      ...currentLevel,
      specializations: updatedSpecs
    });
    setNewSpec('');
  };

  const handleRemoveSpecialization = (specToRemove: string) => {
    if (!currentLevel) return;
    const currentSpecs = currentLevel.specializations || [];
    const updatedSpecs = currentSpecs.filter(s => s !== specToRemove);
    
    // إذا أصبحت المصفوفة فارغة، نعتبرها عامة
    const finalSpecs = updatedSpecs.length === 0 ? ['عام'] : updatedSpecs;
    if (updatedSpecs.length === 0) {
      setIsGeneral(true);
    }

    setCurrentLevel({
      ...currentLevel,
      specializations: finalSpecs
    });
  };

  const handleToggleGeneral = (checked: boolean) => {
    setIsGeneral(checked);
    if (checked && currentLevel) {
      setCurrentLevel({
        ...currentLevel,
        specializations: ['عام']
      });
    } else if (!checked && currentLevel) {
      // إزالة "عام" والسماح للمستخدم بإدخال تخصصات جديدة
      setCurrentLevel({
        ...currentLevel,
        specializations: []
      });
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!currentLevel?.name?.trim() || !currentLevel.stage) return;
    
    const finalSpecs = isGeneral || !currentLevel.specializations || currentLevel.specializations.length === 0
      ? ['عام']
      : currentLevel.specializations;

    await onSave({
      ...currentLevel,
      specializations: finalSpecs
    } as AcademicLevel);
    
    handleCloseModal();
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا المستوى؟ قد يؤثر ذلك على تصفية التلاميذ والأفواج المرتبطة به.')) {
      await onDelete(id);
    }
  };

  const getStageLabel = (stage: AcademicLevel['stage']) => {
    switch (stage) {
      case 'primary': return 'ابتدائي';
      case 'middle': return 'متوسط';
      case 'high': return 'ثانوي';
      case 'university': return 'جامعي';
      default: return 'أخرى';
    }
  };

  const getStageBadgeClass = (stage: AcademicLevel['stage']) => {
    switch (stage) {
      case 'primary': return 'badge-green';
      case 'middle': return 'badge-blue';
      case 'high': return 'badge-success';
      case 'university': return 'badge-warning';
      default: return 'badge-blue';
    }
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-title">
          <h2>إدارة المستويات والتخصصات</h2>
          <p>تعريف الأطوار التعليمية والمستويات الدراسية والتخصصات المتاحة بالمركز لدعم عملية التسجيل الدقيق للأفواج والتلاميذ</p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenAddModal}>
          <Plus size={18} />
          إضافة مستوى جديد
        </button>
      </div>

      {/* تبويبات الأطوار الدراسية */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', overflowX: 'auto', paddingBottom: '8px' }}>
        {[
          { key: 'all', label: 'كل المستويات' },
          { key: 'primary', label: 'الطور الابتدائي' },
          { key: 'middle', label: 'الطور المتوسط' },
          { key: 'high', label: 'الطور الثانوي' },
          { key: 'university', label: 'التعليم الجامعي' },
          { key: 'other', label: 'أطوار أخرى' }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setSelectedStageTab(tab.key as any)}
            className={`btn ${selectedStageTab === tab.key ? 'btn-primary' : 'btn-outline'}`}
            style={{ padding: '8px 16px', borderRadius: '20px', whiteSpace: 'nowrap', fontSize: '0.85rem' }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* شريط البحث */}
      <div className="filters-container">
        <div className="filter-group">
          <label className="filter-label">البحث عن مستوى أو تخصص</label>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              className="filter-input"
              placeholder="ابحث باسم المستوى أو التخصص..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '100%', paddingRight: '40px' }}
            />
            <Search size={18} style={{ position: 'absolute', right: '14px', top: '12px', color: 'var(--text-light)' }} />
          </div>
        </div>
      </div>

      {/* شبكة بطاقات المستويات */}
      {filteredLevels.length > 0 ? (
        <div className="cards-grid">
          {filteredLevels.map(level => {
            const isLevelGeneral = level.specializations.length === 1 && level.specializations[0] === 'عام';
            return (
              <div key={level.id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div className="card-header" style={{ paddingBottom: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
                      <h3 className="card-title">{level.name}</h3>
                      <span className={`badge ${getStageBadgeClass(level.stage)}`}>
                        {getStageLabel(level.stage)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="card-body" style={{ padding: '0 16px 16px 16px' }}>
                    <div style={{ marginTop: '8px' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>
                        التخصصات والشعب الدراسية:
                      </span>
                      {isLevelGeneral ? (
                        <span className="badge badge-blue" style={{ fontSize: '0.8rem', padding: '4px 10px' }}>
                          <CheckCircle2 size={12} style={{ marginLeft: '4px' }} />
                          مستوى عام (بدون تخصصات)
                        </span>
                      ) : (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                          {level.specializations.map((spec, index) => (
                            <span 
                              key={index} 
                              className="badge" 
                              style={{ 
                                backgroundColor: 'rgba(99, 102, 241, 0.1)', 
                                color: 'var(--primary-color)', 
                                border: '1px solid rgba(99, 102, 241, 0.2)',
                                fontSize: '0.75rem',
                                padding: '4px 8px'
                              }}
                            >
                              {spec}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="card-footer" style={{ borderTop: '1px solid var(--border-color)', marginTop: 'auto', padding: '12px 16px' }}>
                  <div style={{ display: 'flex', gap: '8px', width: '100%', justifyContent: 'flex-end' }}>
                    <button 
                      className="btn-icon-only" 
                      title="تعديل" 
                      onClick={() => handleOpenEditModal(level)}
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      className="btn-icon-only danger" 
                      title="حذف" 
                      onClick={() => handleDelete(level.id)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="no-data-card">
          <FileText className="no-data-icon" size={48} />
          <h4 className="no-data-text">لم يتم العثور على أي مستويات دراسية</h4>
          <p>أضف مستوى دراسياً وتخصصات لتظهر هنا في القائمة.</p>
        </div>
      )}

      {/* نافذة الإضافة والتعديل */}
      {isModalOpen && currentLevel && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h3 className="modal-title">
                {currentLevel.id ? 'تعديل بيانات المستوى' : 'إضافة مستوى دراسي جديد'}
              </h3>
              <button className="modal-close-btn" onClick={handleCloseModal}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label className="form-label">اسم المستوى الدراسي *</label>
                    <input
                      type="text"
                      className="form-input"
                      required
                      placeholder="مثال: الثالثة ثانوي (بكالوريا) أو السنة الخامسة ابتدائي"
                      value={currentLevel.name || ''}
                      onChange={(e) => setCurrentLevel({ ...currentLevel, name: e.target.value })}
                    />
                  </div>
                  
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label className="form-label">الطور التعليمي *</label>
                    <select
                      className="form-input"
                      value={currentLevel.stage || 'primary'}
                      onChange={(e) => setCurrentLevel({ ...currentLevel, stage: e.target.value as any })}
                    >
                      <option value="primary">الطور الابتدائي</option>
                      <option value="middle">الطور المتوسط</option>
                      <option value="high">الطور الثانوي</option>
                      <option value="university">التعليم الجامعي</option>
                      <option value="other">أخرى</option>
                    </select>
                  </div>

                  <div className="form-group" style={{ gridColumn: 'span 2', marginTop: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                      <input
                        type="checkbox"
                        id="is_general"
                        checked={isGeneral}
                        onChange={(e) => handleToggleGeneral(e.target.checked)}
                        style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                      />
                      <label htmlFor="is_general" style={{ fontWeight: '500', cursor: 'pointer', fontSize: '0.9rem', color: 'var(--text-dark)' }}>
                        مستوى عام (بدون تخصصات فرعية مثل الابتدائي أو المتوسط)
                      </label>
                    </div>

                    {!isGeneral && (
                      <div style={{ border: '1px solid var(--border-color)', padding: '16px', borderRadius: '8px', backgroundColor: 'rgba(249, 250, 251, 0.5)' }}>
                        <label className="form-label" style={{ marginBottom: '8px' }}>إضافة التخصصات والشعب الدراسية</label>
                        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                          <input
                            type="text"
                            className="form-input"
                            placeholder="مثال: علوم تجريبية، رياضيات، لغات أجنبية..."
                            value={newSpec}
                            onChange={(e) => setNewSpec(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddSpecialization();
                              }
                            }}
                          />
                          <button
                            type="button"
                            className="btn btn-outline"
                            onClick={handleAddSpecialization}
                            style={{ whiteSpace: 'nowrap' }}
                          >
                            إضافة
                          </button>
                        </div>

                        {/* قائمة التخصصات الحالية للمستوى */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
                          {currentLevel.specializations && currentLevel.specializations.filter(s => s !== 'عام').length > 0 ? (
                            currentLevel.specializations.filter(s => s !== 'عام').map((spec, index) => (
                              <span
                                key={index}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  padding: '4px 10px',
                                  borderRadius: '16px',
                                  backgroundColor: 'rgba(99, 102, 241, 0.1)',
                                  color: 'var(--primary-color)',
                                  border: '1px solid rgba(99, 102, 241, 0.2)',
                                  fontSize: '0.8rem',
                                  gap: '6px'
                                }}
                              >
                                {spec}
                                <button
                                  type="button"
                                  onClick={() => handleRemoveSpecialization(spec)}
                                  style={{
                                    border: 'none',
                                    background: 'none',
                                    padding: '0',
                                    color: 'var(--text-muted)',
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                  }}
                                  title="حذف"
                                >
                                  <X size={14} className="hover:text-red-500" />
                                </button>
                              </span>
                            ))
                          ) : (
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                              لم يتم إضافة أي تخصصات بعد. يرجى كتابة اسم التخصص والنقر على إضافة.
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={handleCloseModal}>
                  إلغاء
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={!isGeneral && (!currentLevel.specializations || currentLevel.specializations.filter(s => s !== 'عام').length === 0)}
                >
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
