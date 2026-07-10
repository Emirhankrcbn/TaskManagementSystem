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
                _ => filter.IsDescending ? query.OrderByDescending(t => t.CreatedAt) : query.OrderBy(t => t.CreatedAt) // Varsayılan sıralama
            };

            // 4. Toplam Kayıt Sayısını Al (Sayfalama hesabı için)
            var totalCount = await query.CountAsync();

            // 5. Sayfalama (Pagination) İşlemini Uygula ve Veriyi Çek
            var tasks = await query
                .Skip((filter.PageNumber - 1) * filter.PageSize)
                .Take(filter.PageSize)
                .ToListAsync();

            // 6. Sonucu DTO'ya Dönüştür ve Paketle
            return new PagedResultDto<TaskResponseDto>
            {
                Items = _mapper.Map<List<TaskResponseDto>>(tasks),
                TotalCount = totalCount,
                PageNumber = filter.PageNumber,
                PageSize = filter.PageSize
            };
        }

        public async Task<TaskResponseDto> GetTaskByIdAsync(Guid taskId, Guid userId)
        {
            var task = await _context.Tasks
                .AsNoTracking()
                .FirstOrDefaultAsync(t => t.Id == taskId && t.UserId == userId && t.IsDeleted == false); // Silinmişse bulma

            if (task == null)
                throw new Exception("Görev bulunamadı, silinmiş olabilir veya bu göreve erişim yetkiniz yok.");

            return _mapper.Map<TaskResponseDto>(task);
        }

        public async Task<TaskResponseDto> CreateTaskAsync(TaskCreateDto taskCreateDto, Guid userId)
{
    var task = _mapper.Map<Models.TaskItem>(taskCreateDto);
    
    // Görevi Token'dan gelen senin kimliğine atıyoruz
    task.UserId = userId; 
    
    task.CreatedAt = DateTime.UtcNow;
    task.IsDeleted = false;

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
            existingTask.DueDate = taskUpdateDto.DueDate;
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

        // aynı isimli dosyaların birbirini ezmemesi için başlarına rastgele bir GUID ekler
        public async Task<TaskAttachmentResponseDto> UploadAttachmentAsync(Guid taskId, Guid userId, IFormFile file)
        {
            // 1. güvenlik: görev var mı ve bu kullanıcıya mı ait?
            var task = await _context.Tasks.FirstOrDefaultAsync(t => t.Id == taskId && t.UserId == userId);
            if (task == null) throw new Exception("Görev bulunamadı veya yetkiniz yok.");

            if (file == null || file.Length == 0) throw new Exception("Lütfen geçerli bir dosya seçin.");

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

            // 5. veritabanına sadece dosya yolunu yazma
            var attachment = new Models.TaskAttachment
            {
                TaskId = taskId,
                FileName = file.FileName, // orijinal adı
                FilePath = $"/uploads/{uniqueFileName}", // internetten erişilecek yol
                UploadedAt = DateTime.UtcNow
            };

            await _context.TaskAttachments.AddAsync(attachment); 
            await _context.SaveChangesAsync();

            return new TaskAttachmentResponseDto
            {
                Id = attachment.Id,
                FileName = attachment.FileName,
                FilePath = attachment.FilePath,
                UploadedAt = attachment.UploadedAt
            };
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

            // 4. Sonucu dön
            return new TaskCommentResponseDto
            {
                Id = comment.Id,
                TaskId = comment.TaskId,
                UserId = comment.UserId,
                Content = comment.Comment, // <-- DÜZELTME BURADA
                CreatedAt = comment.CreatedAt
            };
        }

        public async Task<List<TaskCommentResponseDto>> GetTaskCommentsAsync(Guid taskId, Guid userId)
        {
            // 1. Güvenlik: Kullanıcı bu görevi görmeye yetkili mi
            var task = await _context.Tasks
                .AsNoTracking()
                .FirstOrDefaultAsync(t => t.Id == taskId && t.UserId == userId && t.IsDeleted == false);
            if (task == null) throw new Exception("Görev bulunamadı.");

            // 2. Göreve ait tüm yorumları en yeniden en eskiye doğru sıralayarak getir
            var comments = await _context.TaskComments
                .AsNoTracking()
                .Where(c => c.TaskId == taskId)
                .OrderByDescending(c => c.CreatedAt)
                .Select(c => new TaskCommentResponseDto
                {
                    Id = c.Id,
                    TaskId = c.TaskId,
                    UserId = c.UserId,
                    Content = c.Comment,
                    CreatedAt = c.CreatedAt
                }).ToListAsync();

            return comments;
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

        public async Task<List<TaskResponseDto>> GetOverdueTasksAsync(Guid userId)
        {
            // Vadesi geçenleri bulma mantığı:
            // 1. Kullanıcıya ait ve silinmemiş olacak
            // 2. Bitiş tarihi (DueDate) şu anki zamandan (UtcNow) daha KÜÇÜK olacak
            // 3. Görev henüz "Tamamlandı" statüsünde olmayacak (Status enum'unda 2'nin Tamamlandı olduğunu varsayıyoruz)
            
            var overdueTasks = await _context.Tasks
                .Where(t => t.UserId == userId && 
                            t.IsDeleted == false && 
                            t.DueDate < DateTime.UtcNow && 
                            (int)t.Status != 2) 
                .OrderBy(t => t.DueDate) // En çok geciken en üstte çıksın diye tarihe göre sıralıyoruz
                .ToListAsync();

            return _mapper.Map<List<TaskResponseDto>>(overdueTasks);
        }
    }
}