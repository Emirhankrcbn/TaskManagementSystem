using AutoMapper;
using Microsoft.EntityFrameworkCore;
using TaskManagement.API.Data;
using TaskManagement.API.DTOs;
using TaskManagement.API.Models;

namespace TaskManagement.API.Services
{
    public class TaskService : ITaskService
    {
        private readonly ApplicationDbContext _context;
        private readonly IMapper _mapper;

        public TaskService(ApplicationDbContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }

        public async Task<PagedResultDto<TaskResponseDto>> GetAllTasksByUserIdAsync(Guid userId, TaskFilterDto filter)
        {
            // 1. Temel Sorguyu Başlat (Sadece aktif ve bu kullanıcıya ait görevler)
            var query = _context.Tasks
                .AsNoTracking()
                .Include(t => t.Category) // include category so AutoMapper maps it into DTO
                .Include(t => t.SubTasks) // alt görevler ilerleme çubuğu için gerekli
                .Where(t => t.UserId == userId && t.IsDeleted == false)
                .AsQueryable();

            // 2. Filtreleri Uygula
            if (!string.IsNullOrWhiteSpace(filter.SearchTerm))
            {
                var searchTerm = filter.SearchTerm.ToLower();
                query = query.Where(t => t.Title.ToLower().Contains(searchTerm) || 
                                        (t.Description != null && t.Description.ToLower().Contains(searchTerm)));
            }

            if (filter.CategoryId.HasValue)
                query = query.Where(t => t.CategoryId == filter.CategoryId.Value);

            if (filter.Status.HasValue)
                query = query.Where(t => t.Status == filter.Status.Value);

            if (filter.Priority.HasValue)
                query = query.Where(t => t.Priority == filter.Priority.Value);

            // 3. Sıralama İşlemi
            query = filter.SortBy?.ToLower() switch
            {
                "duedate" => filter.IsDescending ? query.OrderByDescending(t => t.DueDate) : query.OrderBy(t => t.DueDate),
                "priority" => filter.IsDescending ? query.OrderByDescending(t => t.Priority) : query.OrderBy(t => t.Priority),
                "title" => filter.IsDescending ? query.OrderByDescending(t => t.Title) : query.OrderBy(t => t.Title),
                "status" => filter.IsDescending ? query.OrderByDescending(t => t.Status) : query.OrderBy(t => t.Status),
                "category" => filter.IsDescending ? query.OrderByDescending(t => t.Category!.Name) : query.OrderBy(t => t.Category!.Name),
                _ => filter.IsDescending ? query.OrderByDescending(t => t.CreatedAt) : query.OrderBy(t => t.CreatedAt) // Varsayılan sıralama
            };

            // 4. Toplam Kayıt Sayısını Al (Sayfalama hesabı için)
            var totalCount = await query.CountAsync();

            // 5. Sayfalama (Pagination) İşlemini Uygula ve Veriyi Çek
            // 0 veya negatif pageNumber/pageSize gelirse Skip() negatif olur ve PostgreSQL "OFFSET must not be negative" hatasıyla çöker; bu yüzden güvenli değerlere sabitliyoruz
            var pageNumber = filter.PageNumber < 1 ? 1 : filter.PageNumber;
            var pageSize = filter.PageSize < 1 ? 10 : filter.PageSize;

            var tasks = await query
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            // 6. Sonucu DTO'ya Dönüştür ve Paketle
            return new PagedResultDto<TaskResponseDto>
            {
                Items = _mapper.Map<List<TaskResponseDto>>(tasks),
                TotalCount = totalCount,
                PageNumber = pageNumber,
                PageSize = pageSize
            };
        }

        public async Task<TaskResponseDto> GetTaskByIdAsync(Guid taskId, Guid userId)
        {
            var task = await _context.Tasks
                .AsNoTracking()
                .Include(t => t.Category)
                .Include(t => t.SubTasks)
                .FirstOrDefaultAsync(t => t.Id == taskId && t.UserId == userId && t.IsDeleted == false); // Silinmişse bulma

            if (task == null)
                throw new Exception("Görev bulunamadı, silinmiş olabilir veya bu göreve erişim yetkiniz yok.");

            return _mapper.Map<TaskResponseDto>(task);
        }

        // Saat dilimi belirtilmeden gelen (Kind=Unspecified) tarihleri UTC olarak işaretler;
        // PostgreSQL'in "timestamp with time zone" sütunları yalnızca UTC kabul eder, aksi halde yazma sırasında hata fırlatır
        private static DateTime? NormalizeToUtc(DateTime? value)
        {
            if (value == null) return null;
            return value.Value.Kind == DateTimeKind.Unspecified
                ? DateTime.SpecifyKind(value.Value, DateTimeKind.Utc)
                : value.Value.ToUniversalTime();
        }

        public async Task<TaskResponseDto> CreateTaskAsync(TaskCreateDto taskCreateDto, Guid userId)
{
    var task = _mapper.Map<Models.TaskItem>(taskCreateDto);

    // Görevi Token'dan gelen senin kimliğine atıyoruz
    task.UserId = userId;

    task.CreatedAt = DateTime.UtcNow;
    task.IsDeleted = false;
    task.DueDate = NormalizeToUtc(task.DueDate);
    task.Status = taskCreateDto.Status ?? Models.TaskStatus.Pending;

    _context.Tasks.Add(task);
    await _context.SaveChangesAsync();

    return _mapper.Map<TaskResponseDto>(task);
}

        public async Task<TaskResponseDto> UpdateTaskAsync(Guid taskId, Guid userId, TaskUpdateDto taskUpdateDto)
        {
            var existingTask = await _context.Tasks
                .FirstOrDefaultAsync(t => t.Id == taskId && t.UserId == userId && t.IsDeleted == false); // Silinmiş görevi güncelletme

            if (existingTask == null)
                throw new Exception("Güncellenecek görev bulunamadı veya silinmiş.");

            existingTask.Title = taskUpdateDto.Title;
            existingTask.Description = taskUpdateDto.Description;
            existingTask.Priority = taskUpdateDto.Priority;
            existingTask.Status = taskUpdateDto.Status;
            existingTask.DueDate = NormalizeToUtc(taskUpdateDto.DueDate);
            existingTask.CategoryId = taskUpdateDto.CategoryId;
            existingTask.UpdatedAt = DateTime.UtcNow;

            _context.Tasks.Update(existingTask);
            await _context.SaveChangesAsync();

            return _mapper.Map<TaskResponseDto>(existingTask);
        }

        public async Task<bool> DeleteTaskAsync(Guid taskId, Guid userId)
        {
            var task = await _context.Tasks
                .FirstOrDefaultAsync(t => t.Id == taskId && t.UserId == userId && t.IsDeleted == false); // Zaten silinmişse tekrar silmeye çalışma

            if (task == null)
                throw new Exception("Silinecek görev bulunamadı veya zaten silinmiş.");

            task.IsDeleted = true; // Veriyi silmiyoruz, pasife çekiyoruz
            _context.Tasks.Update(task);
            await _context.SaveChangesAsync();

            return true;
        }

        // İzin verilen dosya uzantıları (güvenlik: .exe, .html, .js gibi çalıştırılabilir/betik dosyaları reddedilir)
        private static readonly HashSet<string> AllowedAttachmentExtensions = new(StringComparer.OrdinalIgnoreCase)
        {
            ".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp",
            ".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx",
            ".txt", ".csv", ".zip", ".rar"
        };

        private const long MaxAttachmentSizeBytes = 10 * 1024 * 1024; // 10 MB

        // aynı isimli dosyaların birbirini ezmemesi için başlarına rastgele bir GUID ekler
        public async Task<TaskAttachmentResponseDto> UploadAttachmentAsync(Guid taskId, Guid userId, IFormFile file)
        {
            // 1. güvenlik: görev var mı ve bu kullanıcıya mı ait?
            var task = await _context.Tasks.FirstOrDefaultAsync(t => t.Id == taskId && t.UserId == userId);
            if (task == null) throw new Exception("Görev bulunamadı veya yetkiniz yok.");

            if (file == null || file.Length == 0) throw new Exception("Lütfen geçerli bir dosya seçin.");

            if (file.Length > MaxAttachmentSizeBytes) throw new Exception("Dosya boyutu 10 MB sınırını aşıyor.");

            var extension = Path.GetExtension(file.FileName);
            if (string.IsNullOrEmpty(extension) || !AllowedAttachmentExtensions.Contains(extension))
                throw new Exception($"Desteklenmeyen dosya türü: {extension}");

            // 2. klasör ayarlama (ProjeDizini/wwwroot/uploads)
            var uploadsFolder = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads");
            if (!Directory.Exists(uploadsFolder))
            {
                Directory.CreateDirectory(uploadsFolder); // klasör yoksa otomatik oluştur
            }

            // 3. benzersiz isim üretme (Örn: 9f8a-4b2c_rapor.pdf)
            var uniqueFileName = $"{Guid.NewGuid()}_{Path.GetFileName(file.FileName)}";
            var physicalPath = Path.Combine(uploadsFolder, uniqueFileName);

            // 4. dosyayı fiziksel olarak sunucuya kaydetme
            using (var stream = new FileStream(physicalPath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            // 5. veritabanına dosya yolu ve meta bilgilerini yazma
            var attachment = new Models.TaskAttachment
            {
                TaskId = taskId,
                FileName = file.FileName, // orijinal adı
                FilePath = $"/uploads/{uniqueFileName}", // internetten erişilecek yol
                FileSize = file.Length,
                ContentType = file.ContentType,
                UploadedAt = DateTime.UtcNow
            };

            await _context.TaskAttachments.AddAsync(attachment);
            await _context.SaveChangesAsync();

            return new TaskAttachmentResponseDto
            {
                Id = attachment.Id,
                FileName = attachment.FileName,
                FilePath = attachment.FilePath,
                FileSize = attachment.FileSize,
                ContentType = attachment.ContentType,
                UploadedAt = attachment.UploadedAt
            };
        }

        public async Task<List<TaskAttachmentResponseDto>> GetTaskAttachmentsAsync(Guid taskId, Guid userId)
        {
            // Güvenlik: görev gerçekten bu kullanıcıya mı ait
            var task = await _context.Tasks
                .AsNoTracking()
                .FirstOrDefaultAsync(t => t.Id == taskId && t.UserId == userId && t.IsDeleted == false);
            if (task == null) throw new Exception("Görev bulunamadı veya yetkiniz yok.");

            return await _context.TaskAttachments
                .AsNoTracking()
                .Where(a => a.TaskId == taskId)
                .OrderByDescending(a => a.UploadedAt)
                .Select(a => new TaskAttachmentResponseDto
                {
                    Id = a.Id,
                    FileName = a.FileName,
                    FilePath = a.FilePath,
                    FileSize = a.FileSize,
                    ContentType = a.ContentType,
                    UploadedAt = a.UploadedAt
                }).ToListAsync();
        }

        public async Task<bool> DeleteAttachmentAsync(Guid taskId, Guid attachmentId, Guid userId)
        {
            // Güvenlik: görev bu kullanıcıya mı ait
            var task = await _context.Tasks
                .FirstOrDefaultAsync(t => t.Id == taskId && t.UserId == userId && t.IsDeleted == false);
            if (task == null) throw new Exception("Görev bulunamadı veya yetkiniz yok.");

            var attachment = await _context.TaskAttachments
                .FirstOrDefaultAsync(a => a.Id == attachmentId && a.TaskId == taskId);
            if (attachment == null) throw new Exception("Silinecek dosya bulunamadı.");

            var physicalPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", attachment.FilePath.TrimStart('/'));
            if (File.Exists(physicalPath))
            {
                File.Delete(physicalPath);
            }

            _context.TaskAttachments.Remove(attachment);
            await _context.SaveChangesAsync();

            return true;
        }

        public async Task<TaskCommentResponseDto> AddCommentAsync(Guid taskId, Guid userId, TaskCommentCreateDto commentDto)
        {
            // 1. Görev gerçekten var mı ve aktif mi kontrolü
            var task = await _context.Tasks.FirstOrDefaultAsync(t => t.Id == taskId && t.UserId == userId && t.IsDeleted == false);
            if (task == null) throw new Exception("Görev bulunamadı veya bu göreve yorum yapma yetkiniz yok.");

            // 2. Yeni yorum nesnesini oluştur
            var comment = new Models.TaskComment
            {
                TaskId = taskId,
                UserId = userId,
                Comment = commentDto.Content, // <-- DÜZELTME BURADA: Modeldeki 'Comment' alanına DTO'daki 'Content' verisini atıyoruz
                CreatedAt = DateTime.UtcNow
            };

            // 3. Veritabanına asenkron olarak kaydet
            await _context.TaskComments.AddAsync(comment);
            await _context.SaveChangesAsync();

            var username = await _context.Users.Where(u => u.Id == userId).Select(u => u.Username).FirstOrDefaultAsync();

            // 4. Sonucu dön
            return new TaskCommentResponseDto
            {
                Id = comment.Id,
                TaskId = comment.TaskId,
                UserId = comment.UserId,
                Username = username ?? string.Empty,
                Content = comment.Comment, // <-- DÜZELTME BURADA
                CreatedAt = comment.CreatedAt,
                UpdatedAt = comment.UpdatedAt
            };
        }

        public async Task<List<TaskCommentResponseDto>> GetTaskCommentsAsync(Guid taskId, Guid userId)
        {
            // 1. Güvenlik: Kullanıcı bu görevi görmeye yetkili mi
            var task = await _context.Tasks
                .AsNoTracking()
                .FirstOrDefaultAsync(t => t.Id == taskId && t.UserId == userId && t.IsDeleted == false);
            if (task == null) throw new Exception("Görev bulunamadı.");

            // 2. Göreve ait tüm yorumları en yeniden en eskiye doğru sıralayarak getir (yazan kullanıcının adıyla birlikte)
            var comments = await _context.TaskComments
                .AsNoTracking()
                .Include(c => c.User)
                .Where(c => c.TaskId == taskId)
                .OrderByDescending(c => c.CreatedAt)
                .Select(c => new TaskCommentResponseDto
                {
                    Id = c.Id,
                    TaskId = c.TaskId,
                    UserId = c.UserId,
                    Username = c.User != null ? c.User.Username : string.Empty,
                    Content = c.Comment,
                    CreatedAt = c.CreatedAt,
                    UpdatedAt = c.UpdatedAt
                }).ToListAsync();

            return comments;
        }

        public async Task<TaskCommentResponseDto> UpdateCommentAsync(Guid taskId, Guid commentId, Guid userId, TaskCommentUpdateDto commentDto)
        {
            // Güvenlik: görev bu kullanıcıya mı ait
            var task = await _context.Tasks.FirstOrDefaultAsync(t => t.Id == taskId && t.UserId == userId && t.IsDeleted == false);
            if (task == null) throw new Exception("Görev bulunamadı veya yetkiniz yok.");

            // Güvenlik: yorum bu göreve ait mi ve gerçekten bu kullanıcı tarafından mı yazılmış
            var comment = await _context.TaskComments
                .FirstOrDefaultAsync(c => c.Id == commentId && c.TaskId == taskId && c.UserId == userId);
            if (comment == null) throw new Exception("Güncellenecek yorum bulunamadı veya bu yorumu düzenleme yetkiniz yok.");

            comment.Comment = commentDto.Content;
            comment.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            var username = await _context.Users.Where(u => u.Id == userId).Select(u => u.Username).FirstOrDefaultAsync();

            return new TaskCommentResponseDto
            {
                Id = comment.Id,
                TaskId = comment.TaskId,
                UserId = comment.UserId,
                Username = username ?? string.Empty,
                Content = comment.Comment,
                CreatedAt = comment.CreatedAt,
                UpdatedAt = comment.UpdatedAt
            };
        }

        public async Task<bool> DeleteCommentAsync(Guid taskId, Guid commentId, Guid userId)
        {
            // Güvenlik: görev bu kullanıcıya mı ait
            var task = await _context.Tasks.FirstOrDefaultAsync(t => t.Id == taskId && t.UserId == userId && t.IsDeleted == false);
            if (task == null) throw new Exception("Görev bulunamadı veya yetkiniz yok.");

            // Güvenlik: yorum bu göreve ait mi ve gerçekten bu kullanıcı tarafından mı yazılmış
            var comment = await _context.TaskComments
                .FirstOrDefaultAsync(c => c.Id == commentId && c.TaskId == taskId && c.UserId == userId);
            if (comment == null) throw new Exception("Silinecek yorum bulunamadı veya bu yorumu silme yetkiniz yok.");

            _context.TaskComments.Remove(comment);
            await _context.SaveChangesAsync();

            return true;
        }

        public async Task<TaskStatisticsDto> GetTaskStatisticsAsync(Guid userId)
        {
            // Kullanıcının silinmemiş tüm görevlerini kapsayan temel sorgu
            var baseQuery = _context.Tasks.Where(t => t.UserId == userId && t.IsDeleted == false);

            // Verileri RAM'e çekmeden, doğrudan veritabanında (SQL 'SELECT COUNT') saydırıyoruz
            var total = await baseQuery.CountAsync();
            
            // NOT: Status alanının (0: Bekliyor, 1: Devam Ediyor, 2: Tamamlandı) şeklinde
            // bir Enum (veya int) olduğunu varsayarak sayım yapıyoruz.
            var pending = await baseQuery.CountAsync(t => (int)t.Status == 0);
            var inProgress = await baseQuery.CountAsync(t => (int)t.Status == 1);
            var completed = await baseQuery.CountAsync(t => (int)t.Status == 2);

            return new TaskStatisticsDto
            {
                TotalTasks = total,
                PendingTasks = pending,
                InProgressTasks = inProgress,
                CompletedTasks = completed
            };
        }

        public async Task<SubTaskResponseDto> AddSubTaskAsync(Guid taskId, Guid userId, SubTaskCreateDto dto)
        {
            // Güvenlik: görev bu kullanıcıya mı ait
            var task = await _context.Tasks.FirstOrDefaultAsync(t => t.Id == taskId && t.UserId == userId && t.IsDeleted == false);
            if (task == null) throw new Exception("Görev bulunamadı veya yetkiniz yok.");

            var subTask = new Models.SubTask
            {
                TaskId = taskId,
                Title = dto.Title,
                Completed = false,
                CreatedAt = DateTime.UtcNow
            };

            await _context.SubTasks.AddAsync(subTask);
            await _context.SaveChangesAsync();

            return new SubTaskResponseDto
            {
                Id = subTask.Id,
                TaskId = subTask.TaskId,
                Title = subTask.Title,
                Completed = subTask.Completed
            };
        }

        public async Task<SubTaskResponseDto> UpdateSubTaskAsync(Guid taskId, Guid subTaskId, Guid userId, SubTaskUpdateDto dto)
        {
            // Güvenlik: görev bu kullanıcıya mı ait
            var task = await _context.Tasks.FirstOrDefaultAsync(t => t.Id == taskId && t.UserId == userId && t.IsDeleted == false);
            if (task == null) throw new Exception("Görev bulunamadı veya yetkiniz yok.");

            var subTask = await _context.SubTasks.FirstOrDefaultAsync(st => st.Id == subTaskId && st.TaskId == taskId);
            if (subTask == null) throw new Exception("Alt görev bulunamadı.");

            subTask.Title = dto.Title;
            subTask.Completed = dto.Completed;

            _context.SubTasks.Update(subTask);
            await _context.SaveChangesAsync();

            return new SubTaskResponseDto
            {
                Id = subTask.Id,
                TaskId = subTask.TaskId,
                Title = subTask.Title,
                Completed = subTask.Completed
            };
        }

        public async Task<bool> DeleteSubTaskAsync(Guid taskId, Guid subTaskId, Guid userId)
        {
            // Güvenlik: görev bu kullanıcıya mı ait
            var task = await _context.Tasks.FirstOrDefaultAsync(t => t.Id == taskId && t.UserId == userId && t.IsDeleted == false);
            if (task == null) throw new Exception("Görev bulunamadı veya yetkiniz yok.");

            var subTask = await _context.SubTasks.FirstOrDefaultAsync(st => st.Id == subTaskId && st.TaskId == taskId);
            if (subTask == null) throw new Exception("Silinecek alt görev bulunamadı.");

            _context.SubTasks.Remove(subTask);
            await _context.SaveChangesAsync();

            return true;
        }

        public async Task<List<TaskResponseDto>> GetOverdueTasksAsync(Guid userId)
        {
            // Vadesi geçenleri bulma mantığı:
            // 1. kullanıcıya ait ve silinmemiş olacak
            // 2. bitiş tarihi (DueDate) şu anki zamandan (UtcNow) daha KÜÇÜK olacak
            // 3. görev henüz "Tamamlandı" statüsünde olmayacak (Status enum'unda 2'nin tamamlandı varsayıyoruz)
            
            var overdueTasks = await _context.Tasks
                .Where(t => t.UserId == userId && 
                            t.IsDeleted == false && 
                            t.DueDate < DateTime.UtcNow && 
                            (int)t.Status != 2)
                .Include(t => t.Category)
                .Include(t => t.SubTasks)
                .OrderBy(t => t.DueDate) // En çok geciken en üstte çıksın diye tarihe göre sıralıyoruz
                .ToListAsync();

            return _mapper.Map<List<TaskResponseDto>>(overdueTasks);
        }
    }
}