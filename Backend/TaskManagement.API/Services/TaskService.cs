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

        public async Task<IEnumerable<TaskResponseDto>> GetAllTasksByUserIdAsync(Guid userId)
        {
            var tasks = await _context.Tasks
                .Where(t => t.UserId == userId)
                .OrderByDescending(t => t.CreatedAt)
                .ToListAsync();

            return _mapper.Map<IEnumerable<TaskResponseDto>>(tasks);
        }

        public async Task<TaskResponseDto> GetTaskByIdAsync(Guid taskId, Guid userId)
        {
            var task = await _context.Tasks
                .FirstOrDefaultAsync(t => t.Id == taskId && t.UserId == userId);

            if (task == null)
                throw new Exception("Görev bulunamadı veya bu göreve erişim yetkiniz yok.");

            return _mapper.Map<TaskResponseDto>(task);
        }

        public async Task<TaskResponseDto> CreateTaskAsync(TaskCreateDto taskCreateDto)
        {
            var taskEntity = _mapper.Map<TaskItem>(taskCreateDto);
            taskEntity.CreatedAt = DateTime.UtcNow;
            taskEntity.Status = Models.TaskStatus.Pending;

            _context.Tasks.Add(taskEntity);
            await _context.SaveChangesAsync();

            return _mapper.Map<TaskResponseDto>(taskEntity);
        }

        public async Task<TaskResponseDto> UpdateTaskAsync(Guid taskId, Guid userId, TaskUpdateDto taskUpdateDto)
        {
            var existingTask = await _context.Tasks
                .FirstOrDefaultAsync(t => t.Id == taskId && t.UserId == userId);

            if (existingTask == null)
                throw new Exception("Güncellenecek görev bulunamadı.");

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
                .FirstOrDefaultAsync(t => t.Id == taskId && t.UserId == userId);

            if (task == null)
                throw new Exception("Silinecek görev bulunamadı.");

            _context.Tasks.Remove(task);
            await _context.SaveChangesAsync();

            return true;
        }
    }
}