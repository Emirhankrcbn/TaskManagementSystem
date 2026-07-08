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

        // JWT Token'ın içinden giriş yapmış kullanıcının ID'sini çıkaran yardımcı metodumuz
        private Guid GetUserId()
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            return Guid.Parse(userIdStr!);
        }

        [HttpGet]
        public async Task<IActionResult> GetAllTasks()
        {
            var tasks = await _taskService.GetAllTasksByUserIdAsync(GetUserId());
            return Ok(tasks); // 200 OK ile listeyi dönüyoruz
        }

        [HttpGet("{id}")]
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
            // İleride TaskCreateDto içine UserId maplemeyi eklicem
            var createdTask = await _taskService.CreateTaskAsync(taskCreateDto);
            return CreatedAtAction(nameof(GetTaskById), new { id = createdTask.Id }, createdTask); // 201 Created
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
    }
}