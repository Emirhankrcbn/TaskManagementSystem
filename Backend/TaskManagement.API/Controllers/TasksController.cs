// Create, Read, Update, Delete işlemleri

using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TaskManagement.API.DTOs;
using TaskManagement.API.Services;

namespace TaskManagement.API.Controllers
{
    [Authorize] // Güvenlik kalkanı: Token zorunlu!
    [Route("api/[controller]")]
    [ApiController]
    public class TasksController : ControllerBase
    {
        private readonly ITaskService _taskService;

        public TasksController(ITaskService taskService)
        {
            _taskService = taskService;
        }

        private Guid GetUserId()
{
    var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
    
    // BURAYA BAKALIM:
    Console.WriteLine("----------------------------------------");
    Console.WriteLine("İSTEK ATAN KULLANICI ID (Token'dan): " + userIdStr);
    Console.WriteLine("----------------------------------------");
    
    return Guid.Parse(userIdStr!);
}

        [HttpGet]
        public async Task<IActionResult> GetAllTasks([FromQuery] TaskFilterDto filter)
        {
            var result = await _taskService.GetAllTasksByUserIdAsync(GetUserId(), filter);
            return Ok(result);
        }

        [HttpGet("{id:guid}")]
        public async Task<IActionResult> GetTaskById(Guid id)
        {
            try
            {
                var task = await _taskService.GetTaskByIdAsync(id, GetUserId());
                return Ok(task);
            }
            catch (Exception ex)
            {
                return NotFound(new { error = ex.Message }); // 404 Bulunamadı
            }
        }

        [HttpPost]
        public async Task<IActionResult> CreateTask([FromBody] TaskCreateDto taskCreateDto)
        {
            var result = await _taskService.CreateTaskAsync(taskCreateDto, GetUserId());
            return CreatedAtAction(nameof(GetTaskById), new { id = result.Id }, result);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateTask(Guid id, [FromBody] TaskUpdateDto taskUpdateDto)
        {
            try
            {
                var updatedTask = await _taskService.UpdateTaskAsync(id, GetUserId(), taskUpdateDto);
                return Ok(updatedTask);
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteTask(Guid id)
        {
            try
            {
                await _taskService.DeleteTaskAsync(id, GetUserId());
                return NoContent(); // 204 No Content: Başarıyla silindi, dönecek veri yok
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        // Dosya yükleme için yeni bir endpointi
        [HttpPost("{taskId}/attachments")]
        [Consumes("multipart/form-data")] // Sadece dosya yükleme isteklerini kabul et
        public async Task<IActionResult> UploadAttachment(Guid taskId, [FromForm] TaskAttachmentUploadDto uploadDto)
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var result = await _taskService.UploadAttachmentAsync(taskId, userId, uploadDto.File);
            return Ok(result);
        }

        // Göreve yeni yorum ekleme
        [HttpPost("{taskId}/comments")]
        public async Task<IActionResult> AddComment(Guid taskId, [FromBody] TaskCommentCreateDto commentDto)
        {
            var result = await _taskService.AddCommentAsync(taskId, GetUserId(), commentDto);
            return StatusCode(201, result); // 201 Created döner
        }

        // Görevin yorumlarını listeleme
        [HttpGet("{taskId}/comments")]
        public async Task<IActionResult> GetTaskComments(Guid taskId)
        {
            var result = await _taskService.GetTaskCommentsAsync(taskId, GetUserId());
            return Ok(result); // 200 OK ile listeyi döner
        }

        [HttpGet("statistics")]
        public async Task<IActionResult> GetTaskStatistics()
        {
            var result = await _taskService.GetTaskStatisticsAsync(GetUserId());
            return Ok(result);
        }

        [HttpGet("overdue")]
        public async Task<IActionResult> GetOverdueTasks()
        {
            var result = await _taskService.GetOverdueTasksAsync(GetUserId());
            return Ok(result);
        }
    }
}